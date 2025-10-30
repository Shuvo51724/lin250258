export interface License {
  licenseId: string;
  licenseKeyHash: string;
  status: 'active' | 'revoked' | 'expired';
  activatedAt: string;
  activatedBy?: string;
  lastSeenIP?: string;
  expiresAt?: string;
  notes?: string;
}

export interface ActivationLog {
  id: string;
  licenseId: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  clientId?: string;
  clientInfo?: any;
  success: boolean;
  error?: string;
}

export interface TamperReport {
  id: string;
  timestamp: string;
  licenseId?: string;
  clientId?: string;
  ip?: string;
  tamperType: 'file_modified' | 'file_missing' | 'decoy_modified' | 'decoy_removed' | 'manifest_invalid';
  details: any;
}

export interface LicenseToken {
  licenseId: string;
  iat: number;
  exp: number;
  signatureVersion: string;
}

export interface ManifestFile {
  version: string;
  generatedAt: string;
  files: Record<string, string>; // path -> sha256:hash
  decoys: string[]; // paths of decoy files
}
