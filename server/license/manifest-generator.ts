import fs from 'fs/promises';
import path from 'path';
import { computeFileHash, signManifest } from './utils';
import type { ManifestFile } from './types';

const DECOY_FILES = [
  'LICENSE_FAKE.md',
  'README_KEY_HINT.txt',
  'docs/KEYS_NOT_HERE.md',
  'keys/NOT_THIS_ONE.key',
];

const CRITICAL_FILES = [
  'server/index.ts',
  'server/routes.ts',
  'server/license/routes.ts',
  'server/license/utils.ts',
  'server/license/storage.ts',
  'client/src/App.tsx',
  'client/src/contexts/AuthContext.tsx',
  'package.json',
];

async function computeFilesHashes(files: string[]): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file);
      const hash = computeFileHash(content);
      hashes[file] = `sha256:${hash}`;
    } catch (error) {
      console.warn(`Warning: Could not hash file ${file}:`, error);
    }
  }
  
  return hashes;
}

export async function generateManifest(): Promise<{ manifest: ManifestFile; signature: string }> {
  const allFiles = [...CRITICAL_FILES, ...DECOY_FILES];
  const fileHashes = await computeFilesHashes(allFiles);
  
  const manifest: ManifestFile = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    files: fileHashes,
    decoys: DECOY_FILES,
  };
  
  const signature = signManifest(manifest);
  
  return { manifest, signature };
}

export async function saveManifest(manifest: ManifestFile, signature: string): Promise<void> {
  const manifestPath = path.join(process.cwd(), 'data', 'license', 'manifest.json');
  const signaturePath = path.join(process.cwd(), 'data', 'license', 'manifest.sig');
  
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), { mode: 0o600 });
  await fs.writeFile(signaturePath, signature, { mode: 0o600 });
  
  console.log('Manifest generated and saved successfully');
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Signature: ${signaturePath}`);
}

export async function loadManifest(): Promise<{ manifest: ManifestFile; signature: string } | null> {
  try {
    const manifestPath = path.join(process.cwd(), 'data', 'license', 'manifest.json');
    const signaturePath = path.join(process.cwd(), 'data', 'license', 'manifest.sig');
    
    const [manifestContent, signature] = await Promise.all([
      fs.readFile(manifestPath, 'utf-8'),
      fs.readFile(signaturePath, 'utf-8'),
    ]);
    
    const manifest = JSON.parse(manifestContent);
    return { manifest, signature: signature.trim() };
  } catch (error) {
    return null;
  }
}

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

if (import.meta.url === `file://${process.argv[1]}`) {
  generateManifest()
    .then(({ manifest, signature }) => saveManifest(manifest, signature))
    .then(() => console.log('Manifest generation complete'))
    .catch(error => {
      console.error('Failed to generate manifest:', error);
      process.exit(1);
    });
}
