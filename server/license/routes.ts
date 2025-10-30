import type { Express, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { storage } from './storage';
import { isValidMasterKey, hashLicenseKey, signToken, verifyToken } from './utils';
import type { License, ActivationLog, TamperReport } from './types';

const activationAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function checkRateLimit(ip: string): { allowed: boolean; error?: string } {
  const now = Date.now();
  const attempt = activationAttempts.get(ip);
  
  if (!attempt) {
    activationAttempts.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }
  
  if (now - attempt.firstAttempt > RATE_LIMIT_WINDOW) {
    activationAttempts.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }
  
  if (attempt.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      error: `Too many activation attempts. Please try again in ${Math.ceil((RATE_LIMIT_WINDOW - (now - attempt.firstAttempt)) / 60000)} minutes.`
    };
  }
  
  attempt.count++;
  return { allowed: true };
}

function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, attempt] of activationAttempts.entries()) {
    if (now - attempt.firstAttempt > RATE_LIMIT_WINDOW) {
      activationAttempts.delete(ip);
    }
  }
}

setInterval(cleanupRateLimits, 5 * 60 * 1000); // Cleanup every 5 minutes

export function registerLicenseRoutes(app: Express): void {
  
  app.post('/api/license/activate', async (req: Request, res: Response) => {
    const { key, clientId, clientInfo } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];
    
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      await storage.logActivation({
        id: nanoid(),
        licenseId: 'rate-limited',
        timestamp: new Date().toISOString(),
        ip,
        userAgent,
        clientId,
        clientInfo,
        success: false,
        error: rateLimit.error,
      });
      
      return res.status(429).json({ ok: false, error: rateLimit.error });
    }
    
    if (!key || typeof key !== 'string') {
      await storage.logActivation({
        id: nanoid(),
        licenseId: 'invalid-request',
        timestamp: new Date().toISOString(),
        ip,
        userAgent,
        clientId,
        clientInfo,
        success: false,
        error: 'Missing or invalid key',
      });
      
      return res.status(400).json({ ok: false, error: 'License key is required' });
    }
    
    if (!isValidMasterKey(key)) {
      await storage.logActivation({
        id: nanoid(),
        licenseId: 'invalid-key',
        timestamp: new Date().toISOString(),
        ip,
        userAgent,
        clientId,
        clientInfo,
        success: false,
        error: 'Invalid license key',
      });
      
      return res.status(401).json({ ok: false, error: 'Invalid license key' });
    }
    
    const keyHash = hashLicenseKey(key);
    let license = await storage.findLicenseByKeyHash(keyHash);
    
    if (!license) {
      const licenseId = nanoid();
      license = {
        licenseId,
        licenseKeyHash: keyHash,
        status: 'active',
        activatedAt: new Date().toISOString(),
        lastSeenIP: ip,
      };
      await storage.saveLicense(license);
    } else {
      if (license.status === 'revoked') {
        await storage.logActivation({
          id: nanoid(),
          licenseId: license.licenseId,
          timestamp: new Date().toISOString(),
          ip,
          userAgent,
          clientId,
          clientInfo,
          success: false,
          error: 'License has been revoked',
        });
        
        return res.status(403).json({ ok: false, error: 'This license has been revoked. Please contact support.' });
      }
      
      if (license.status === 'expired') {
        await storage.logActivation({
          id: nanoid(),
          licenseId: license.licenseId,
          timestamp: new Date().toISOString(),
          ip,
          userAgent,
          clientId,
          clientInfo,
          success: false,
          error: 'License has expired',
        });
        
        return res.status(403).json({ ok: false, error: 'This license has expired. Please contact support.' });
      }
      
      license.lastSeenIP = ip;
      await storage.saveLicense(license);
    }
    
    const token = signToken(license.licenseId);
    
    await storage.logActivation({
      id: nanoid(),
      licenseId: license.licenseId,
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      clientId,
      clientInfo,
      success: true,
    });
    
    res.json({ ok: true, token, licenseId: license.licenseId });
  });
  
  app.get('/api/license/status', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
    }
    
    const license = await storage.getLicense(decoded.licenseId);
    
    if (!license) {
      return res.status(404).json({ ok: false, error: 'License not found' });
    }
    
    if (license.status !== 'active') {
      return res.json({
        ok: false,
        status: license.status,
        error: `License is ${license.status}`,
      });
    }
    
    res.json({
      ok: true,
      status: license.status,
      licenseId: license.licenseId,
      activatedAt: license.activatedAt,
      expiresAt: license.expiresAt,
    });
  });
  
  app.post('/api/license/revoke', async (req: Request, res: Response) => {
    const { licenseId, reason } = req.body;
    
    if (!licenseId) {
      return res.status(400).json({ ok: false, error: 'License ID required' });
    }
    
    const license = await storage.getLicense(licenseId);
    
    if (!license) {
      return res.status(404).json({ ok: false, error: 'License not found' });
    }
    
    license.status = 'revoked';
    license.notes = reason || 'Revoked by admin';
    await storage.saveLicense(license);
    
    res.json({ ok: true, message: 'License revoked successfully' });
  });
  
  app.post('/api/license/tamper-report', async (req: Request, res: Response) => {
    const { tamperType, details, clientId } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    const authHeader = req.headers.authorization;
    let licenseId: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) {
        licenseId = decoded.licenseId;
      }
    }
    
    const report: TamperReport = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      licenseId,
      clientId,
      ip,
      tamperType,
      details,
    };
    
    await storage.logTamperReport(report);
    
    console.warn('[TAMPER DETECTED]', report);
    
    res.json({ ok: true, message: 'Tamper report logged' });
  });
  
  app.get('/api/license/audit', async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;
    
    const [activations, tamperReports] = await Promise.all([
      storage.getActivationLogs(limit),
      storage.getTamperReports(limit),
    ]);
    
    res.json({
      ok: true,
      activations,
      tamperReports,
    });
  });
  
  app.get('/api/license/list', async (req: Request, res: Response) => {
    const licenses = await storage.getLicenses();
    
    const sanitizedLicenses = Object.values(licenses).map(license => ({
      licenseId: license.licenseId,
      status: license.status,
      activatedAt: license.activatedAt,
      lastSeenIP: license.lastSeenIP,
      expiresAt: license.expiresAt,
      notes: license.notes,
    }));
    
    res.json({ ok: true, licenses: sanitizedLicenses });
  });
}
