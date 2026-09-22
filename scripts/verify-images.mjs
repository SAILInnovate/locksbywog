/**
 * Checks that the image manifest in src/lib/images.ts matches the files that
 * scripts/optimize-images.sh actually produced.
 *
 * This guards the one failure mode that TypeScript cannot catch: the manifest
 * is plain data, so listing a width that was never generated compiles fine and
 * only shows up as a broken image in the browser.
 *
 * Usage:  node scripts/verify-images.mjs [--dist]
 *         --dist also checks the built output in dist/ rather than public/.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const checkDist = process.argv.includes('--dist');
const imageRoot = join(root, checkDist ? 'dist/images' : 'public/images');

const manifestSource = readFileSync(join(root, 'src/lib/images.ts'), 'utf8');

// Entries look like:
//   logo: {
//     name: 'logo',
//     widths: [128, 256, 384],
//     fallback: '/images/locsbywogggg.png',
const entryPattern =
  /name:\s*'([^']+)',\s*widths:\s*\[([^\]]*)\],\s*fallback:\s*'([^']+)'/g;

const entries = [...manifestSource.matchAll(entryPattern)].map((m) => ({
  name: m[1],
  widths: m[2]
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean)
    .map(Number),
  fallback: m[3],
}));

if (entries.length === 0) {
  console.error('error: found no image manifest entries in src/lib/images.ts');
  process.exit(1);
}

console.log(`Checking ${entries.length} manifest entries against ${checkDist ? 'dist/' : 'public/'}\n`);

let missing = 0;
let checked = 0;

for (const entry of entries) {
  const problems = [];

  for (const width of entry.widths) {
    const rel = `/images/opt/${entry.name}-${width}.webp`;
    checked += 1;
    if (!existsSync(join(imageRoot, 'opt', `${entry.name}-${width}.webp`))) {
      problems.push(`missing generated WebP: ${rel}`);
    }
  }

  // Fallback is stored as a site-absolute path such as /images/foo.png, while
  // imageRoot already points at the images directory itself.
  const fallbackRel = entry.fallback.replace(/^\/?images\//, '');
  checked += 1;
  if (!existsSync(join(imageRoot, fallbackRel))) {
    problems.push(`missing fallback source: ${entry.fallback}`);
  }

  if (problems.length > 0) {
    missing += problems.length;
    console.log(`FAIL  ${entry.name}`);
    for (const p of problems) console.log(`        ${p}`);
  } else {
    const sizes = entry.widths.map((w) => `${w}w`).join(', ');
    console.log(`ok    ${entry.name.padEnd(16)} ${sizes}`);
  }
}

console.log(`\n${checked} references checked, ${missing} missing`);

if (missing > 0) {
  console.log(
    '\nRun ./scripts/optimize-images.sh to regenerate, and keep its MANIFEST\n' +
      'widths in sync with src/lib/images.ts.'
  );
  process.exit(1);
}

console.log('All image references resolve.');
