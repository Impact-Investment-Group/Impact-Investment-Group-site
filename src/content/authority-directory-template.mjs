// Kept under src so Tailwind compiles the static gallery's literal utility classes.
const gridClass = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";
const cardClass =
  "group flex h-full min-w-0 flex-col rounded-2xl border border-rule bg-page p-3 transition-colors hover:border-teal-600/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600";
const imageClass = "flex h-20 items-center justify-center overflow-hidden rounded-lg bg-white p-2";
const countries = ["England", "Scotland", "Wales", "Northern Ireland"];
const countryId = (country) => country.toLowerCase().replaceAll(" ", "-");
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  );

export function renderAuthorityDirectory(authorities, basePath = "/") {
  const base = basePath.replace(/\/+$/, "");
  const grouped = countries.map((country) => ({
    country,
    rows: authorities
      .filter((row) => row.country === country)
      .sort((a, b) => a.name.localeCompare(b.name, "en-GB")),
  }));
  const cards = (rows) =>
    rows
      .map(
        (row) => `<li data-authority-code="${escape(row.gss_code)}">
    <a href="${escape(row.website)}" target="_blank" rel="noopener noreferrer" class="${cardClass}">
      <span class="${imageClass}"><img src="${escape(base + row.logo)}" alt="" width="296" height="136" loading="lazy" decoding="async" class="size-full object-contain"></span>
      <span class="mt-3 text-pretty text-sm font-semibold leading-snug text-ink">${escape(row.name)}</span>
      <span class="mt-auto flex items-center justify-between gap-2 pt-2 text-xs leading-relaxed text-ink-muted">${escape(row.country)}<svg aria-hidden="true" class="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10M7 17 17 7"/></svg></span>
      <span class="sr-only"> (opens in a new tab)</span>
    </a></li>`,
      )
      .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>UK local authorities | Impact Investment Group</title>
  <meta name="description" content="Browse the logos and official websites of all 382 current UK principal local authorities.">
  <link rel="canonical" href="https://impactinvestmentgroup.co.uk/local-authorities/">
  <link rel="icon" href="${escape(base)}/favicon.png">
  <!-- authority-styles:start --><link rel="stylesheet" href="/src/styles.css"><!-- authority-styles:end -->
</head>
<body class="bg-page text-ink">
  <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-page focus:p-4 focus:outline-2 focus:outline-teal-600">Skip to local authorities</a>
  <header class="border-b border-rule">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8">
      <a href="${escape(base)}/" class="inline-flex min-h-11 items-center font-heading text-xl font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">Impact Investment Group</a>
      <a href="${escape(base)}/#commissioning-councils" class="inline-flex min-h-11 items-center text-sm font-semibold text-teal-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">Back to the homepage</a>
    </div>
  </header>
  <main id="main" class="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
    <p class="text-sm font-semibold text-teal-600">Across the United Kingdom</p>
    <h1 class="mt-3 text-balance font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl">UK local authorities</h1>
    <p class="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-ink-muted">All 382 current principal local authorities, with their logos and official websites. Choose a country or browse the complete directory below.</p>
    <nav aria-label="Countries" class="mt-6 flex flex-wrap gap-2">${grouped.map(({ country, rows }) => `<a href="#${countryId(country)}" class="inline-flex min-h-11 items-center gap-2 rounded-full border border-rule px-4 text-sm font-semibold text-ink transition-colors hover:bg-cream-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">${country}<span class="tabular-nums text-ink-muted">${rows.length}</span></a>`).join("")}</nav>
    ${grouped
      .map(
        ({
          country,
          rows,
        }) => `<section id="${countryId(country)}" aria-labelledby="${countryId(country)}-heading" class="mt-10 scroll-mt-6 border-t border-rule pt-7">
      <div class="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 id="${countryId(country)}-heading" class="font-heading text-2xl font-semibold text-ink">${country}</h2><p class="text-sm text-ink-muted">${rows.length} local authorities</p></div>
      <ul aria-label="Local authorities in ${country}" class="${gridClass}">${cards(rows)}</ul>
    </section>`,
      )
      .join("\n")}
  </main>
  <footer class="border-t border-rule"><div class="mx-auto max-w-6xl px-5 py-6 sm:px-8"><a href="${escape(base)}/" class="inline-flex min-h-11 items-center text-sm font-semibold text-teal-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">Back to Impact Investment Group</a></div></footer>
</body>
</html>
`;
}
