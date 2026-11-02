/** Site colour gate. Resolves the real CSS declarations, not a copied palette.
 *
 * Wave 777 widened it from the 29 flat pairs of wave 443: the translucent icon
 * plates (at rest and on hover) are composited over each light ground, the
 * teal bed under teal text is checked, and a few pairs that are measured but
 * deliberately not a job are printed as `info` rows with no floor, so that
 * every ratio CLAUDE.md section 2 states is read off this script's output. */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const baseline = process.argv.includes("--baseline");
const raw = baseline
  ? execFileSync("git", ["show", "bb39b3ed:src/styles.css"], { encoding: "utf8" })
  : readFileSync("src/styles.css", "utf8");
const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");
const declarations = new Map(
  [...css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map((m) => [m[1], m[2].trim()]),
);
function value(name, seen = new Set()) {
  if (/^#[\da-f]{6}$/i.test(name)) return name.toUpperCase();
  if (seen.has(name)) throw new Error(`Cyclic colour: ${name}`);
  seen.add(name);
  const definition = declarations.get(name);
  if (!definition) throw new Error(`Missing colour: ${name}`);
  const alias = definition.match(/^var\((--[\w-]+)\)$/);
  if (alias) return value(alias[1], seen);
  if (!/^#[\da-f]{6}$/i.test(definition))
    throw new Error(`Unresolved colour: ${name} = ${definition}`);
  return definition.toUpperCase();
}
/* A translucent plate. `color-mix(in oklab, var(--x) N%, transparent)` is --x
   at alpha N/100 (the transparent end has no colour to mix), and the browser
   composites that over the ground in sRGB. The definition is read from the
   stylesheet: a custom property by name, or the background-color of the rule
   whose selector list starts at the beginning of a line with `selector,`. */
function tintDefinition(source) {
  if (source.startsWith("--")) {
    const definition = declarations.get(source);
    if (!definition) throw new Error(`Missing tint: ${source}`);
    return definition;
  }
  const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rule = css.match(new RegExp(`^${escaped},[^{]*\\{\\s*background-color:\\s*([^;]+);`, "m"));
  if (!rule) throw new Error(`Missing plate rule: ${source}`);
  return rule[1].trim();
}
const channels = (hex) =>
  hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16));
function plate(source, groundName) {
  const definition = tintDefinition(source);
  const mix = definition.match(
    /^color-mix\(in oklab, var\((--[\w-]+)\) (\d+(?:\.\d+)?)%, transparent\)$/,
  );
  if (!mix) throw new Error(`Not a translucent tint: ${source} = ${definition}`);
  const alpha = Number(mix[2]) / 100;
  const ink = channels(value(mix[1]));
  const ground = channels(value(groundName));
  return `#${ink
    .map((c, i) =>
      Math.round(c * alpha + ground[i] * (1 - alpha))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}
const luminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return channels.reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
};
const ratio = (a, b) =>
  (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
const LIGHT = ["--color-white", "--color-page", "--color-page-alt", "--color-cream-card"];
const checks = [];
for (const ground of LIGHT) {
  for (const ink of [
    "--color-ink",
    "--color-ink-muted",
    "--color-orange-700",
    "--color-teal-600",
  ]) {
    checks.push([ink, ground, 4.5]);
  }
}
checks.push(
  ["--color-white", "--color-orange-600", 4.5],
  ["--color-white", "--primary", 4.5],
  ["--color-white", "--sidebar-primary", 4.5],
  ["--color-white", "--color-navy-950", 4.5],
  ["--color-white", "--color-navy-800", 4.5],
  ["--color-teal-400", "--color-navy-950", 4.5],
  ["--color-orange-500", "--color-page", 3],
  ["--color-orange-500", "--color-page-alt", 3],
  ["--color-orange-500", "--color-cream-card", 3],
  ["--color-orange-500", "--color-navy-950", 3],
  ["--color-ink-soft", "--color-white", 4.5],
  ["--color-ink-soft", "--color-page", 4.5],
  ["--color-destructive-on-light", "--color-page-alt", 4.5],
  // Wave 777.
  ["--color-page", "--color-orange-600", 4.5], // `text-page` on a filled orange tile
  ["--color-white", "--color-teal-600", 4.5], // a label on the data button or a teal disc
  ["--color-page", "--color-teal-600", 4.5],
  ["--accent-foreground", "--accent", 4.5],
  ["--color-teal-600", "--secondary", 4.5], // teal text on the teal bed
  ["--secondary-foreground", "--secondary", 4.5],
  ["--sidebar-accent-foreground", "--sidebar-accent", 4.5],
  ["--color-destructive-on-light", "--color-white", 4.5],
  ["--color-destructive-on-light", "--color-page", 4.5],
  ["--color-destructive-on-light", "--color-cream-card", 4.5],
  ["--color-orange-500", "--color-white", 3],
  ["--color-orange-500", "--color-navy-800", 3],
  ...LIGHT.map((ground) => ["--color-teal-500", ground, 3]),
  // The hover of the 404 and error pages' buttons (`__root.tsx`): a solid
  // step, because `bg-primary/90` over white was 3.96:1.
  ["--primary-foreground", "--color-orange-700", 4.5],
);
/* The icon plates: a glyph is a graphic and answers to 3:1 (SC 1.4.11). */
const PLATES = [
  ["--color-teal-600", "--color-tint-teal"],
  ["--color-teal-600", ".group:hover .icon-tone-teal"],
  ["--color-orange-600", "--color-tint-orange"],
  ["--color-orange-600", ".group:hover .icon-tone-orange"],
];
for (const [glyph, source] of PLATES) {
  for (const ground of LIGHT) checks.push([glyph, { plate: source, over: ground }, 3]);
}
/* Measured and printed, never asserted: each says why a colour is NOT used
   for a job, and CLAUDE.md quotes them. */
const INFO = [
  ["--color-ink-soft", "--color-page-alt"],
  ["--color-ink-soft", "--color-cream-card"],
  ...LIGHT.map((ground) => ["--color-teal-400", ground]),
  ...LIGHT.map((ground) => ["--color-orange-600", ground]),
  ["--color-white", "--color-orange-500"],
  // The luminance gap between the teal fill and the orange (wave 442 kept one).
  ["--color-teal-500", "--color-orange-500"],
  // Teal TEXT on the icon plate's tint: why that text sits on --secondary.
  ...LIGHT.map((ground) => ["--color-teal-600", { plate: "--color-tint-teal", over: ground }]),
];
const describe = (bg) => (typeof bg === "string" ? bg : `${bg.plate} over ${bg.over}`);
const resolve = (bg) => (typeof bg === "string" ? value(bg) : plate(bg.plate, bg.over));
const unresolved = [];
const measure = ([fg, bg, floor]) => {
  try {
    const foreground = value(fg);
    const background = resolve(bg);
    const contrast = ratio(foreground, background);
    return [
      {
        fg,
        bg: describe(bg),
        foreground,
        background,
        floor,
        contrast,
        pass: floor == null ? null : contrast >= floor,
      },
    ];
  } catch (error) {
    // A baseline stylesheet predates some of these names; anything else is a defect.
    if (!baseline) throw error;
    unresolved.push(`${fg} on ${describe(bg)}: ${error.message}`);
    return [];
  }
};
const rows = checks.flatMap(measure);
const info = INFO.map(([fg, bg]) => [fg, bg, null]).flatMap(measure);
const failures = rows
  .filter((row) => !row.pass)
  .map((row) => `${row.fg} on ${row.bg}: ${row.contrast.toFixed(3)}`);
/* The platform's values (web `src/index.css`), with wave 777's lift of the
   navy and the teal. `--dv-track` is the site's own. Since wave 882
   (R-OP-1102-7) `--bg-tint` and `--bg-cream` are the site's own too: a bone
   white, no longer the platform's two beds. */
const expected = {
  "--brand-primary": "#E15E31",
  "--brand-primary-ink": "#BB441B",
  "--brand-primary-fill": "#CC4A22",
  "--brand-primary-soft": "#FFF0EB",
  "--brand-primary-light": "#F07E56",
  "--brand-primary-on-ink": "#FFA181",
  "--brand-teal": "#258D8A",
  "--brand-teal-ink": "#267977",
  "--brand-teal-soft": "#EBF6F6",
  "--brand-teal-on-ink": "#70CECC",
  "--brand-ink": "#14366A",
  "--brand-slate": "#647289",
  "--bg-canvas": "#FDFDFB",
  "--bg-tint": "#F9F9F4",
  "--bg-cream": "#F2F2EC",
  "--dv-track": "#F3EAE0",
};
if (!baseline)
  for (const [name, hex] of Object.entries(expected)) {
    if (value(name) !== hex) failures.push(`Platform v4 parity failed: ${name}`);
  }
/* Wave 777: each utility does the platform's job for its colour. The three
   orange jobs are R541-1's; teal-700 and teal-800 must exist, or Tailwind's
   default teal paints them. */
const jobs = {
  "--color-orange-500": "--brand-primary",
  "--color-orange-600": "--brand-primary-fill",
  "--color-orange-700": "--brand-primary-ink",
  "--primary": "--brand-primary-fill",
  "--sidebar-primary": "--brand-primary-fill",
  "--color-teal-400": "--brand-teal-on-ink",
  "--color-teal-500": "--brand-teal",
  "--color-teal-600": "--brand-teal-ink",
  "--color-teal-700": "--brand-teal-ink",
  "--color-teal-800": "--brand-teal-ink",
  "--secondary": "--brand-teal-soft",
  "--color-ink": "--brand-ink",
  "--color-navy-950": "--brand-ink",
  "--color-page": "--bg-canvas",
  "--color-page-alt": "--bg-tint",
  "--color-cream-card": "--bg-cream",
};
if (!baseline)
  for (const [utility, job] of Object.entries(jobs)) {
    if (value(utility) !== value(job))
      failures.push(`Job mapping failed: ${utility} is not ${job}`);
  }
/* Wave 777 retired the v4 navy, the three v4 teals and the two R523-1-era warm
   beds; the older names are wave 443's. Wave 882 (R-OP-1102-7) retired the two
   warm pink beds, fef8f5 and f8f0ec. */
const retired =
  /#(?:c15f3c|ae4e30|f0a886|9a4429|f27216|bf4b1b|ffefb2|00112b|041c3d|0a2a52|143c6b|2fbaaa|1e9e8f|17796f|ff6b00|25d1c2|ff7a29|0a2c60|208a87|1a706e|66c4c2|fbf6f0|f5ede4|fef8f5|f8f0ec)\b|rgba?\(\s*(?:255[, ]+107[, ]+0|37[, ]+209[, ]+194|0[, ]+17[, ]+43|10[, ]+44[, ]+96|32[, ]+138[, ]+135|26[, ]+112[, ]+110|102[, ]+196[, ]+194|251[, ]+246[, ]+240|245[, ]+237[, ]+228|254[, ]+248[, ]+245|248[, ]+240[, ]+236)\s*[,/)]/gi;
function scan(dir, pattern = retired) {
  const hits = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) hits.push(...scan(path, pattern));
    else if (/\.(?:css|tsx?|jsx?|html|svg)$/.test(entry)) {
      const source = readFileSync(path, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");
      const matches = [...source.matchAll(pattern)].map((m) => m[0]);
      if (matches.length) hits.push({ file: path, values: [...new Set(matches)] });
    }
  }
  return hits;
}
const sourceHits = baseline ? [] : scan("src");
if (sourceHits.length) failures.push("Retired colours remain in source");
/* Wave 777: a page's orange button may not hover to a translucent fill. Over
   white, `bg-primary/90` put the white label at 3.96:1; the hover is the solid
   ink step, checked above. Pages only: the unused library variants keep theirs. */
const translucentHover = /hover:bg-(?:primary|orange-\d{3})\/\d+/g;
const hoverHits = baseline ? [] : scan("src/routes", translucentHover);
if (hoverHits.length) failures.push("A page's orange fill hovers to a translucent step");
const buildIndex = process.argv.indexOf("--build");
const buildHits = buildIndex >= 0 ? scan(process.argv[buildIndex + 1]) : null;
if (buildHits?.length) failures.push("Retired colours remain in built text assets");
console.log(
  JSON.stringify(
    {
      baseline,
      pairs: rows.length,
      rows,
      info,
      unresolved,
      sourceHits,
      hoverHits,
      buildHits,
      failures,
    },
    null,
    2,
  ),
);
if (failures.length && !baseline) process.exitCode = 1;
