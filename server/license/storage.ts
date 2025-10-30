import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import type { License, ActivationLog, TamperReport } from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'license');
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');
const ACTIVATIONS_FILE = path.join(DATA_DIR, 'activations.jsonl');
const TAMPER_REPORTS_FILE = path.join(DATA_DIR, 'tamper-reports.jsonl');

class LicenseStorage {
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.ensureDataDir();
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
      
      try {
        await fs.access(LICENSES_FILE);
      } catch {
        await this.writeAtomic(LICENSES_FILE, '{}');
      }
      
      try {
        await fs.access(ACTIVATIONS_FILE);
      } catch {
        await fs.writeFile(ACTIVATIONS_FILE, '', { mode: 0o600 });
      }
      
      try {
        await fs.access(TAMPER_REPORTS_FILE);
      } catch {
        await fs.writeFile(TAMPER_REPORTS_FILE, '', { mode: 0o600 });
      }
    } catch (error) {
      console.error('Failed to initialize license storage:', error);
      throw error;
    }
  }

  private async writeAtomic(filepath: string, content: string): Promise<void> {
    const tempFile = `${filepath}.tmp.${nanoid()}`;
    try {
      await fs.writeFile(tempFile, content, { mode: 0o600 });
      await fs.rename(tempFile, filepath);
    } catch (error) {
      try {
        await fs.unlink(tempFile);
      } catch {}
      throw error;
    }
  }

  async getLicenses(): Promise<Record<string, License>> {
    await this.initPromise;
    try {
      const content = await fs.readFile(LICENSES_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to read licenses:', error);
      return {};
    }
  }

  async getLicense(licenseId: string): Promise<License | null> {
    const licenses = await this.getLicenses();
    return licenses[licenseId] || null;
  }

  async saveLicense(license: License): Promise<void> {
    await this.initPromise;
    const licenses = await this.getLicenses();
    licenses[license.licenseId] = license;
    await this.writeAtomic(LICENSES_FILE, JSON.stringify(licenses, null, 2));
  }

  async findLicenseByKeyHash(keyHash: string): Promise<License | null> {
    const licenses = await this.getLicenses();
    for (const license of Object.values(licenses)) {
      if (license.licenseKeyHash === keyHash) {
        return license;
      }
    }
    return null;
  }

  async logActivation(log: ActivationLog): Promise<void> {
    await this.initPromise;
    const line = JSON.stringify(log) + '\n';
    await fs.appendFile(ACTIVATIONS_FILE, line, { mode: 0o600 });
  }

  async getActivationLogs(limit: number = 100): Promise<ActivationLog[]> {
    await this.initPromise;
    try {
      const content = await fs.readFile(ACTIVATIONS_FILE, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.slice(-limit).map(line => JSON.parse(line));
    } catch (error) {
      return [];
    }
  }

  async logTamperReport(report: TamperReport): Promise<void> {
    await this.initPromise;
    const line = JSON.stringify(report) + '\n';
    await fs.appendFile(TAMPER_REPORTS_FILE, line, { mode: 0o600 });
  }

  async getTamperReports(limit: number = 100): Promise<TamperReport[]> {
    await this.initPromise;
    try {
      const content = await fs.readFile(TAMPER_REPORTS_FILE, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.slice(-limit).map(line => JSON.parse(line));
    } catch (error) {
      return [];
    }
  }
}

export const storage = new LicenseStorage();
