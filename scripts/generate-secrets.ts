#!/usr/bin/env tsx

import crypto from 'crypto';

function generateSecret(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

console.log('='.repeat(70));
console.log('LICENSE SYSTEM - SECURITY SECRETS GENERATOR');
console.log('='.repeat(70));
console.log('\nGenerate these secrets and add them to your environment variables:');
console.log('\n' + '-'.repeat(70));

const licenseJwtSecret = generateSecret(64);
const manifestSecret = generateSecret(64);
const masterKeyHash = hashKey('ava-I-can-never-tell-you');

console.log('\n# License JWT Secret (for signing activation tokens)');
console.log(`LICENSE_JWT_SECRET=${licenseJwtSecret}`);

console.log('\n# Manifest Secret (for signing file integrity manifests)');
console.log(`MANIFEST_SECRET=${manifestSecret}`);

console.log('\n# Master Key Hashes (comma-separated SHA256 hashes of valid master keys)');
console.log(`# Default key: "ava-I-can-never-tell-you"`);
console.log(`MASTER_KEY_HASHES=${masterKeyHash}`);

console.log('\n# Token Expiry (default: 1 year)');
console.log('TOKEN_EXPIRY=1y');

console.log('\n' + '-'.repeat(70));
console.log('\nIMPORTANT SECURITY NOTES:');
console.log('1. NEVER commit these secrets to version control');
console.log('2. Store them securely in your host environment or secret manager');
console.log('3. Use different secrets for development and production');
console.log('4. Rotate secrets periodically for security');
console.log('5. The default master key hash is for "ava-I-can-never-tell-you"');
console.log('6. To add more master keys, compute their SHA256 hash and add to the list');
console.log('\nTo compute hash for a new master key:');
console.log('  echo -n "your-master-key" | sha256sum');
console.log('\n' + '='.repeat(70));
