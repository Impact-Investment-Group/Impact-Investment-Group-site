// CI-only visual proof entry. This bundles the real renderer without mocks;
// it is kept in the evidence artifact, outside the deployable Pages output.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const output = resolve("docs/screenshots/wave909/buddy-artwork");
await mkdir(output, { recursive: true });
const result = await Bun.build({
  entrypoints: ["scripts/buddy-proof-entry.js"],
  outdir: output,
  naming: "buddy-engine-proof.js",
  target: "browser",
  format: "esm",
  minify: false,
});
if (!result.success) throw new AggregateError(result.logs, "Buddy visual proof bundle failed");
const files = ["buddy-engine.js", "buddy-art.js", "buddy-motion.js", "buddy-play.js", "buddy-ambient-director.js"];
const sources = {};
for (const file of files) {
  const bytes = await readFile(resolve("src/components/buddy", file));
  sources[file] = createHash("sha256").update(bytes).digest("hex");
}
const props = await readFile(resolve("public/images/buddy/play-props-v1.webp"));
sources["play-props-v1.webp"] = createHash("sha256").update(props).digest("hex");
await writeFile(resolve(output, "runtime-source.json"), JSON.stringify({
  commit: process.env.GITHUB_SHA ?? null,
  evidence: "Real renderer source bundled with Bun for fixed-time browser visual inspection. This diagnostic bundle is not the minified Pages chunk; normal site browser journeys verify the shipped runtime separately.",
  sources,
}, null, 2));
console.log("Prepared real Buddy renderer for CI visual inspection.");
