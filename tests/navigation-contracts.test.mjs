import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

function collectTsxFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectTsxFiles(path) : entry.name.endsWith('.tsx') ? [path] : [];
  });
}

test('application navigation avoids the broken Vinext client-side Link runtime', () => {
  for (const directory of ['app', 'components']) {
    for (const path of collectTsxFiles(join(projectRoot, directory))) {
      assert.doesNotMatch(readFileSync(path, 'utf8'), /from ['"]next\/link['"]/, path);
    }
  }
});

test('safe navigation uses a native anchor and preserves anchor attributes', () => {
  const safeLink = readFileSync(join(projectRoot, 'components/navigation/safe-link.tsx'), 'utf8');
  assert.match(safeLink, /AnchorHTMLAttributes<HTMLAnchorElement>/);
  assert.match(safeLink, /return <a href=\{href\} \{\.\.\.props\} \/>/);
});
