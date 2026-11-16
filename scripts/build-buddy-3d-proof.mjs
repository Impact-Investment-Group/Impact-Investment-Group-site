// CI-only entry using the exact production source and shipped GLB.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const output = resolve('docs/screenshots/wave909/buddy-3d');
await mkdir(output, { recursive: true });
const entry = resolve(output, 'entry.js');
await writeFile(entry, ['buddy-3d.js', 'buddy-inspection-frame.js'].map(file =>
  `export * from ${JSON.stringify(resolve('src/components/buddy', file).replaceAll('\\', '/'))};`).join('\n'));
const result = await Bun.build({ entrypoints: [entry], outdir: output,
  naming: 'buddy-3d-proof.js', target: 'browser', format: 'esm', minify: false });
if (!result.success) throw new AggregateError(result.logs, 'Buddy 3D proof bundle failed');
const files = ['src/components/buddy/buddy-3d.js', 'src/components/buddy/buddy-3d-material.js',
  'src/components/buddy/buddy-inspection-frame.js',
  'public/images/buddy/3d/buddy.glb', 'public/images/buddy/3d/manifest.json'];
const sources = {};
for (const file of files) sources[file] = createHash('sha256').update(await readFile(resolve(file))).digest('hex');
await writeFile(resolve(output, 'runtime-source.json'), JSON.stringify({ commit: process.env.GITHUB_SHA,
  basis: 'Real production renderer and GLB; diagnostic bundle is separate from minified deployed chunks.', sources }, null, 2));
