import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";

type Country = "England" | "Scotland" | "Wales" | "Northern Ireland";
interface Authority {
  gss_code: string;
  name: string;
  area_name: string;
  country: Country;
  website: string;
  logo: string;
}
const countries: Country[] = ["England", "Scotland", "Wales", "Northern Ireland"];
const batchSize = 24;
const expectedCount = 382;
const normalise = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-GB");

// The generated no-JavaScript gallery uses these same Tailwind classes.
export const authorityGridClassName =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";
export const authorityCardClassName =
  "group flex h-full min-w-0 flex-col rounded-2xl border border-rule bg-page p-3 transition-colors hover:border-teal-600/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600";
export const authorityImageClassName =
  "flex h-20 items-center justify-center overflow-hidden rounded-lg bg-white p-2";

function readAuthorities(data: unknown): Authority[] {
  const entries = (data as { authorities?: unknown } | null)?.authorities;
  if (!Array.isArray(entries) || entries.length !== expectedCount)
    throw new Error("Incomplete directory");
  const codes = new Set<string>();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") throw new Error("Invalid authority");
    const row = entry as Authority;
    if (
      !/^[ENSW]\d{8}$/.test(row.gss_code) ||
      codes.has(row.gss_code) ||
      typeof row.name !== "string" ||
      !row.name.trim() ||
      typeof row.area_name !== "string" ||
      !countries.includes(row.country) ||
      typeof row.website !== "string" ||
      !/^https?:\/\//.test(row.website) ||
      row.logo !== `/images/logos/councils/uk/${row.gss_code}.webp`
    )
      throw new Error("Invalid authority");
    codes.add(row.gss_code);
  }
  return [...entries].sort((a: Authority, b: Authority) => a.name.localeCompare(b.name, "en-GB"));
}

function AuthorityCard({ authority }: { authority: Authority }) {
  const [failed, setFailed] = useState(false);
  return (
    <li data-authority-code={authority.gss_code}>
      <a
        href={authority.website}
        target="_blank"
        rel="noopener noreferrer"
        className={authorityCardClassName}
      >
        <span className={authorityImageClassName}>
          {failed ? (
            <span className="text-center text-xs leading-relaxed text-ink-muted">
              Logo unavailable
            </span>
          ) : (
            <img
              src={authority.logo}
              alt=""
              loading="lazy"
              decoding="async"
              width={296}
              height={136}
              onError={() => setFailed(true)}
              className="size-full object-contain"
            />
          )}
        </span>
        <span className="mt-3 text-pretty text-sm font-semibold leading-snug text-ink">
          {authority.name}
        </span>
        <span className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs leading-relaxed text-ink-muted">
          {authority.country}
          <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
        </span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </li>
  );
}

export function LocalAuthorityDirectory() {
  const [authorities, setAuthorities] = useState<Authority[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<Country | "">("");
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const focusNewResult = useRef<number | null>(null);

  useEffect(() => {
    const index = focusNewResult.current;
    if (index === null) return;
    focusNewResult.current = null;
    resultsRef.current?.children.item(index)?.querySelector("a")?.focus();
  }, [visibleCount]);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setFailed(false);
    void fetch("/data/uk-local-authorities.json", {
      credentials: "omit",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Directory unavailable");
        return response.json();
      })
      .then((data: unknown) => {
        const entries = readAuthorities(data);
        if (current) setAuthorities(entries);
      })
      .catch(() => {
        if (current) setFailed(true);
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      current = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [attempt]);

  const matches = useMemo(() => {
    const words = normalise(query).trim().split(/\s+/).filter(Boolean);
    return (authorities ?? []).filter((authority) => {
      if (country && authority.country !== country) return false;
      const text = normalise(
        `${authority.name} ${authority.area_name} ${authority.country} ${authority.gss_code}`,
      );
      return words.every((word) => text.includes(word));
    });
  }, [authorities, query, country]);

  function clearFilters() {
    setQuery("");
    setCountry("");
    setVisibleCount(batchSize);
    searchRef.current?.focus();
  }

  if (!authorities)
    return (
      <div className="rounded-2xl border border-rule px-5 py-6 text-center">
        <p role="status" className="text-sm leading-relaxed text-ink-muted">
          {failed
            ? "The directory could not load. Try again or open the complete directory."
            : "Loading local authorities…"}
        </p>
        {failed ? (
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-rule px-4 text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
          >
            Try again
          </button>
        ) : null}
        <a
          href="/local-authorities/"
          className="mt-2 flex min-h-11 items-center justify-center text-sm font-semibold text-teal-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
        >
          Open the complete directory
        </a>
      </div>
    );

  return (
    <div data-authority-directory className="border-t border-rule pt-6">
      <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(180px,.65fr)_auto]">
        <div className="min-w-0">
          <label htmlFor="authority-search" className="mb-2 block text-sm font-semibold text-ink">
            Find a local authority
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              id="authority-search"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(batchSize);
              }}
              placeholder="Council name or area"
              aria-controls="authority-results"
              className="min-h-12 w-full min-w-0 rounded-xl border border-rule bg-page py-3 pr-3 pl-10 text-base text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            />
          </div>
        </div>
        <div className="min-w-0">
          <label htmlFor="authority-country" className="mb-2 block text-sm font-semibold text-ink">
            Country
          </label>
          <select
            id="authority-country"
            value={country}
            onChange={(event) => {
              setCountry(event.target.value as Country | "");
              setVisibleCount(batchSize);
            }}
            aria-controls="authority-results"
            className="min-h-12 w-full min-w-0 rounded-xl border border-rule bg-page px-3 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <option value="">All UK countries</option>
            {countries.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={clearFilters}
          disabled={!query && !country}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-rule px-4 text-sm font-semibold text-ink transition-colors hover:bg-cream-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 disabled:cursor-default disabled:opacity-50"
        >
          Clear filters
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="my-5 text-sm leading-relaxed text-ink-muted"
      >
        {matches.length
          ? `Showing ${Math.min(visibleCount, matches.length)} of ${matches.length} local ${matches.length === 1 ? "authority" : "authorities"}${country ? ` in ${country}` : ""}`
          : "No local authorities match. Try another name or clear the filters."}
      </p>
      <ul
        ref={resultsRef}
        id="authority-results"
        aria-label="Local authorities"
        className={authorityGridClassName}
      >
        {matches.slice(0, visibleCount).map((authority) => (
          <AuthorityCard key={authority.gss_code} authority={authority} />
        ))}
      </ul>
      {visibleCount < matches.length ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            aria-controls="authority-results"
            onClick={() => {
              focusNewResult.current = visibleCount;
              setVisibleCount((value) => value + batchSize);
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-rule bg-page px-6 text-sm font-semibold text-ink transition-colors hover:border-teal-600 hover:bg-cream-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
          >
            Show {Math.min(batchSize, matches.length - visibleCount)} more local authorities
          </button>
        </div>
      ) : null}
    </div>
  );
}
