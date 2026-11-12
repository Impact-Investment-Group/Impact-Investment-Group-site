import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const countryCounts = { England: 317, Scotland: 32, Wales: 22, "Northern Ireland": 11 };

export function validateAuthorityCatalogue(catalogue, publicRoot) {
  const authorities = catalogue?.authorities;
  assert(
    Array.isArray(authorities) && authorities.length === 382,
    "The authority directory must contain all 382 entries",
  );
  const codes = new Set();
  const counts = Object.fromEntries(Object.keys(countryCounts).map((country) => [country, 0]));
  for (const row of authorities) {
    assert(row && typeof row === "object", "Every authority must be an object");
    assert(
      typeof row.gss_code === "string" && /^[ENSW]\d{8}$/.test(row.gss_code) && !codes.has(row.gss_code),
      `Invalid or duplicate GSS code: ${row.gss_code}`,
    );
    codes.add(row.gss_code);
    assert(
      typeof row.name === "string" && row.name.trim() && typeof row.area_name === "string",
      `Missing authority name: ${row.gss_code}`,
    );
    assert(Object.hasOwn(countryCounts, row.country), `Unknown country: ${row.gss_code}`);
    counts[row.country] += 1;
    const website = new URL(row.website);
    assert(
      ["http:", "https:"].includes(website.protocol) && website.hostname,
      `Invalid official website: ${row.gss_code}`,
    );
    assert.equal(
      row.logo,
      `/images/logos/councils/uk/${row.gss_code}.webp`,
      `Logo must use its canonical local path: ${row.gss_code}`,
    );
    const image = join(publicRoot, row.logo.slice(1));
    assert(
      statSync(image).isFile() && statSync(image).size > 0,
      `Missing or empty authority logo: ${row.gss_code}`,
    );
  }
  assert.deepEqual(counts, countryCounts, "Authority counts must match the reviewed four-country roster");
  return authorities;
}

export async function buildAuthorityDirectory(root = projectRoot) {
  const publicRoot = join(root, "public");
  const catalogueFile = join(publicRoot, "data/uk-local-authorities.json");
  const templateFile = join(root, "src/content/authority-directory-template.mjs");
  if (!existsSync(catalogueFile) && !existsSync(templateFile)) {
    console.log("authority-directory: older site content has no directory; skipping generation");
    return;
  }
  assert(
    existsSync(catalogueFile) && existsSync(templateFile),
    "Authority catalogue and template must both be present",
  );
  const { renderAuthorityDirectory } = await import(pathToFileURL(templateFile).href);
  const catalogue = JSON.parse(readFileSync(catalogueFile, "utf8"));
  const authorities = validateAuthorityCatalogue(catalogue, publicRoot);
  const target = join(publicRoot, "local-authorities/index.html");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, renderAuthorityDirectory(authorities, process.env.BASE_PATH ?? "/"));
  console.log(`authority-directory: generated ${authorities.length} real-logo entries across four countries`);
}

export function finaliseAuthorityDirectory(buildDir, stylesheets) {
  const file = join(buildDir, "local-authorities/index.html");
  if (!existsSync(file)) return;
  assert(stylesheets, "The static authority directory requires the built site stylesheets");
  const source = readFileSync(file, "utf8");
  const codes = [...source.matchAll(/data-authority-code="([ENSW]\d{8})"/g)].map((match) => match[1]);
  assert(
    codes.length === 382 && new Set(codes).size === 382,
    "The built static directory must preserve all 382 unique authorities",
  );
  const marker = /<!-- authority-styles:start -->[\s\S]*?<!-- authority-styles:end -->/;
  assert(marker.test(source), "Authority stylesheet marker is missing");
  const result = source.replace(
    marker,
    `<!-- authority-styles:start -->${stylesheets}<!-- authority-styles:end -->`,
  );
  assert(!result.includes('href="/src/styles.css"'), "The static directory cannot ship development CSS");
  writeFileSync(file, result);
  console.log("authority-directory: linked production CSS; complete gallery works without JavaScript");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await buildAuthorityDirectory();
