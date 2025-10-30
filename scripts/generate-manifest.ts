#!/usr/bin/env tsx

import { generateManifest, saveManifest } from '../server/license/manifest-generator';

console.log('Generating license manifest...');

generateManifest()
  .then(({ manifest, signature }) => {
    console.log('\nManifest generated successfully:');
    console.log(`- Files tracked: ${Object.keys(manifest.files).length}`);
    console.log(`- Decoy files: ${manifest.decoys.length}`);
    console.log(`- Generated at: ${manifest.generatedAt}`);
    console.log(`- Signature: ${signature.substring(0, 16)}...`);
    
    return saveManifest(manifest, signature);
  })
  .then(() => {
    console.log('\n✓ Manifest saved to data/license/manifest.json');
    console.log('✓ Signature saved to data/license/manifest.sig');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Failed to generate manifest:', error);
    process.exit(1);
  });
