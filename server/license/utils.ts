import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { LicenseToken, ManifestFile } from './types';

if (!process.env.LICENSE_JWT_SECRET) {
  throw new Error('FATAL: LICENSE_JWT_SECRET environment variable is required. Generate with: openssl rand -hex 64');
}

if (!process.env.MANIFEST_SECRET) {
  throw new Error('FATAL: MANIFEST_SECRET environment variable is required. Generate with: openssl rand -hex 64');
}

if (!process.env.MASTER_KEY_HASHES) {
  throw new Error('FATAL: MASTER_KEY_HASHES environment variable is required. Must contain comma-separated SHA256 hashes of valid master keys.');
}

const LICENSE_JWT_SECRET = process.env.LICENSE_JWT_SECRET;
const MANIFEST_SECRET = process.env.MANIFEST_SECRET;
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '1y';
const SIGNATURE_VERSION = '1';

export function hashLicenseKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function compareKeyHash(key: string, hash: string): boolean {
  const computed = hashLicenseKey(key);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

export function isValidMasterKey(key: string): boolean {
  const masterKeyHashes = process.env.MASTER_KEY_HASHES!.split(',').filter(Boolean);
  const keyHash = hashLicenseKey(key);
  return masterKeyHashes.some(hash => {
    try {
      return crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(hash.trim()));
    } catch {
      return false;
    }
  });
}

export function signToken(licenseId: string): string {
  const payload: Omit<LicenseToken, 'iat' | 'exp'> = {
    licenseId,
    signatureVersion: SIGNATURE_VERSION,
  };
  
  const options: jwt.SignOptions = {
    expiresIn: TOKEN_EXPIRY,
  };
  
  return jwt.sign(payload, LICENSE_JWT_SECRET, options);
}

export function verifyToken(token: string): LicenseToken | null {
  try {
    const decoded = jwt.verify(token, LICENSE_JWT_SECRET) as LicenseToken;
    if (decoded.signatureVersion !== SIGNATURE_VERSION) {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

export function computeFileHash(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function signManifest(manifest: ManifestFile): string {
  const manifestJson = JSON.stringify(manifest);
  const hmac = crypto.createHmac('sha256', MANIFEST_SECRET);
  hmac.update(manifestJson);
  return hmac.digest('hex');
}

export function verifyManifestSignature(manifest: ManifestFile, signature: string): boolean {
  const computed = signManifest(manifest);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function generateClientId(): string {
  return crypto.randomBytes(16).toString('hex');
}
