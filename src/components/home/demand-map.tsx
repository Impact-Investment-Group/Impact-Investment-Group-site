import * as React from "react";

import snapshot from "@/data/public-property-stock.json";
import {
  fetchPublicPropertyStock,
  parsePublicPropertyStock,
  PUBLIC_PROPERTY_STOCK_URL,
  type PublicPropertyStock,
} from "@/lib/public-property-stock";
import { cn } from "@/lib/utils";
import {
  buildDotField,
  buildLinks,
  HEIGHT,
  projection,
  WIDTH,
  type DotField,
  type Hub,
} from "./demand-map-field";

/** Approximate label positions, not listing locations or regional boundaries. */
const REGION_POSITIONS: Record<string, [number, number]> = {
  "North East": [-1.7, 55],
  "North West": [-2.6, 54.2],
  "Yorkshire & The Humber": [-1.3, 53.7],
  "East Midlands": [-1.3, 52.9],
  "West Midlands": [-2.3, 52.4],
  Lincolnshire: [-0.2, 53.1],
  "East of England": [0.7, 52.2],
  "South East": [-0.5, 51.1],
  "South West": [-3.5, 50.8],
  London: [-0.12, 51.51],
  Wales: [-3.7, 52.3],
  Scotland: [-4, 57],
  "Northern Ireland": [-6.5, 54.7],
};

const REFRESH_INTERVAL = 5 * 60 * 1000;
const REQUEST_TIMEOUT = 10 * 1000;
const BUCKETS = 12;

function readSnapshot(): PublicPropertyStock | null {
  try {
    return parsePublicPropertyStock(snapshot);
  } catch {
    return null;
  }
}

const INITIAL_STOCK = readSnapshot();
type StockStatus = "snapshot" | "current" | "unavailable";
type RegionHub = Hub & { count: number };

/** Static pages have a dated public snapshot, then refresh without credentials. */
function usePropertyStock() {
  const [stock, setStock] = React.useState<PublicPropertyStock | null>(INITIAL_STOCK);
  const [status, setStatus] = React.useState<StockStatus>(
    INITIAL_STOCK ? "snapshot" : "unavailable",
  );

  React.useEffect(() => {
    let mounted = true;
    let pending: AbortController | null = null;
    let lastAttempt = 0;

    const refresh = async () => {
      if (document.hidden || pending || Date.now() - lastAttempt < 60_000) return;
      lastAttempt = Date.now();
      const controller = new AbortController();
      pending = controller;
      const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      try {
        const next = await fetchPublicPropertyStock(controller.signal);
        if (!mounted) return;
        setStock((previous) =>
          previous && Date.parse(previous.asOf) > Date.parse(next.asOf) ? previous : next,
        );
        setStatus("current");
      } catch {
        // Keep the last dated aggregate when offline or when the public source
        // cannot be validated. An error is never a zero-property region.
        if (mounted) setStatus("unavailable");
      } finally {
        window.clearTimeout(timeout);
        pending = null;
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL);
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      mounted = false;
      pending?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return { stock, status };
}

function formatAsOf(value: string): string {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return `${day}, ${date.toISOString().slice(11, 16)} UTC`;
}

function addDot(paths: Path2D[], x: number, y: number, rawT: number) {
  const t = Math.max(0, Math.min(1, rawT));
  const radius = 0.85 + t * 0.55;
  const path = paths[Math.min(BUCKETS - 1, Math.round(t * (BUCKETS - 1)))]!;
  path.moveTo(x + radius, y);
  path.arc(x, y, radius, 0, Math.PI * 2);
}

/**
 * Public listing counts use the source's named regional buckets. The luminous
 * UK outline is illustrative scenery, not a heatmap of housing need.
 */
export function DemandMap({
  className,
  visibleIds,
  readout = "beside",
}: {
  className?: string;
  /** Optional source region names or their lowercase hyphenated forms. */
  visibleIds?: string[];
  /** Below preserves the homepage map's full column width. */
  readout?: "beside" | "overlay" | "below";
}) {
  const { stock, status } = usePropertyStock();
  const [activeName, setActiveName] = React.useState("North West");
  const [field, setField] = React.useState<DotField | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const dotPaths = React.useRef<Path2D[] | null>(null);
  const pickerId = React.useId();
  const haloId = `${pickerId}-halo`;
  const innerId = `${pickerId}-inner`;
  const active = stock?.regions.find((region) => region.name === activeName) ?? stock?.regions[0];
  const selectedName = active?.name ?? "";
  const overlay = readout === "overlay";
  const below = readout === "below";

  const hubs = React.useMemo<RegionHub[]>(() => {
    if (!stock) return [];
    const maxCount = Math.max(1, ...stock.regions.map((region) => region.count));
    return stock.regions.flatMap((region) => {
      const position = Object.hasOwn(REGION_POSITIONS, region.name)
        ? REGION_POSITIONS[region.name]
        : undefined;
      const point = position ? projection(position) : null;
      if (!point) return [];
      return [
        {
          id: region.name,
          name: region.name,
          count: region.count,
          x: Math.round(point[0] * 100) / 100,
          y: Math.round(point[1] * 100) / 100,
          weight: Math.sqrt(region.count / maxCount),
          intensity: 0,
        },
      ];
    });
  }, [stock]);
  const links = React.useMemo(() => buildLinks(hubs), [hubs]);

  React.useEffect(() => {
    let cancelled = false;
    const build = () => {
      if (!cancelled) setField(buildDotField());
    };
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback;
    if (idle) idle(build);
    else window.setTimeout(build, 0);
    return () => {
      cancelled = true;
    };
  }, []);

  const paint = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !field) return;
    const rendered = canvas.clientWidth || WIDTH;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const unit = (rendered / WIDTH) * dpr;
    const width = Math.round(WIDTH * unit);
    const height = Math.round(HEIGHT * unit);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(unit, 0, 0, unit, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Uniform coastline shading. The old illustrative authority intensity is
    // deliberately not used to colour a map of actual property availability.
    if (!dotPaths.current) {
      const paths = Array.from({ length: BUCKETS }, () => new Path2D());
      for (let i = 0; i < field.count; i++) {
        const offset = i * 4;
        addDot(
          paths,
          field.data[offset]!,
          field.data[offset + 1]!,
          0.24 + field.data[offset + 2]! * 0.46,
        );
      }
      dotPaths.current = paths;
    }

    const palette = getComputedStyle(document.documentElement);
    const channels = (name: string) => {
      const hex = palette.getPropertyValue(name).trim();
      return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
    };
    const base = channels("--brand-ink");
    const hot = channels("--brand-teal-on-ink");
    const mix = (t: number, channel: 0 | 1 | 2) =>
      Math.round(base[channel]! + (hot[channel]! - base[channel]!) * t);
    for (let b = 0; b < BUCKETS; b++) {
      const t = b / (BUCKETS - 1);
      ctx.fillStyle = `rgba(${mix(t, 0)}, ${mix(t, 1)}, ${mix(t, 2)}, ${(0.62 + t * 0.38).toFixed(3)})`;
      ctx.fill(dotPaths.current[b]!);
    }
  }, [field]);

  React.useEffect(() => {
    paint();
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(paint, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [paint]);

  return (
    <div
      data-property-map=""
      className={cn(
        overlay || below
          ? "relative"
          : "grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem] md:items-center",
        className,
      )}
    >
      <div
        className={cn(
          "section-dark relative mx-auto w-full px-3 py-4 sm:px-4 sm:py-5",
          overlay || below ? "max-w-[34rem] lg:max-w-none" : "max-w-[30rem]",
        )}
      >
        <div className="relative">
          {field === null ? (
            <span aria-hidden="true" className="map-skeleton absolute inset-0" />
          ) : null}
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            data-map={field === null ? undefined : "in"}
            className="pointer-events-none absolute inset-0 size-full"
          />
          {/* All regions, including ones without a map position, are accessible
            through the native selector below. Map points offer pointer preview. */}
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true" className="relative w-full">
            <defs>
              <radialGradient id={haloId}>
                <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.55" />
                <stop offset="45%" stopColor="var(--brand-primary)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={innerId}>
                <stop offset="0%" stopColor="var(--brand-primary-on-ink)" stopOpacity="0.95" />
                <stop offset="40%" stopColor="var(--brand-primary)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--brand-primary-ink)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g stroke="var(--brand-primary)" strokeWidth="0.5" strokeOpacity="0.15">
              {links.map(({ a, b }) => (
                <line key={`${a.id}-${b.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              ))}
            </g>
            {hubs.map((hub, index) => {
              const selected = hub.name === selectedName;
              const slug = hub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              const dimmed =
                visibleIds && !visibleIds.includes(hub.name) && !visibleIds.includes(slug);
              const scale = 1 + hub.weight * 0.9 + (selected ? 0.35 : 0);
              return (
                <g
                  key={hub.id}
                  data-region-marker={hub.name}
                  data-selected={selected ? "true" : "false"}
                  transform={`translate(${hub.x} ${hub.y})`}
                  opacity={dimmed ? 0.18 : 1}
                  onMouseEnter={() => setActiveName(hub.name)}
                  onClick={() => setActiveName(hub.name)}
                  className="cursor-pointer max-lg:pointer-events-none"
                >
                  <circle r="24" fill="transparent" />
                  {hub.count > 0 ? (
                    <g className="demand-hub" style={{ animationDelay: `${(index % 7) * 420}ms` }}>
                      <circle r={14 * scale} fill={`url(#${haloId})`} />
                      <circle r={5 * scale} fill={`url(#${innerId})`} />
                      <circle r={1.5 * scale} fill="var(--brand-primary-on-ink)" />
                    </g>
                  ) : (
                    <circle r="4" fill="none" stroke="var(--brand-teal-on-ink)" strokeWidth="1" />
                  )}
                  {selected ? (
                    <circle
                      r="19"
                      fill="none"
                      stroke="var(--brand-teal-on-ink)"
                      strokeWidth="1.5"
                    />
                  ) : null}
                  <title>{hub.name}</title>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="relative mt-2 text-center text-xs leading-relaxed text-white/80">
          Regional listing totals. Marker positions and background are illustrative.
        </p>
      </div>

      <aside
        className={cn(
          "panel p-4 sm:p-5",
          below && "mt-5",
          overlay &&
            "mt-6 lg:absolute lg:right-0 lg:top-6 lg:mt-0 lg:w-[19rem] lg:bg-page/92 lg:backdrop-blur-sm",
        )}
      >
        <label htmlFor={pickerId} className="eyebrow block text-teal-600">
          Explore an area
        </label>
        <select
          id={pickerId}
          data-region-picker=""
          autoComplete="off"
          value={selectedName}
          onChange={(event) => setActiveName(event.target.value)}
          disabled={!stock}
          className="mt-2 min-h-11 w-full cursor-pointer rounded-[10px] border border-rule bg-page px-3 py-2 font-heading text-base font-bold text-ink focus-visible:border-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-default"
        >
          {stock ? (
            stock.regions.map((region) => (
              <option key={region.name} value={region.name}>
                {region.name === "Unmapped" ? "Unmapped (area not assigned)" : region.name}
              </option>
            ))
          ) : (
            <option value="">Area counts unavailable</option>
          )}
        </select>

        <div aria-live="polite" aria-atomic="true" className="mt-4">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs leading-relaxed text-ink-soft">
                Property listings in this area
              </dt>
              <dd
                data-region-count=""
                data-region-name={selectedName}
                className="mt-1 font-heading text-2xl font-bold tabular-nums text-ink"
              >
                {active ? active.count.toLocaleString("en-GB") : "Unavailable"}
              </dd>
            </div>
            <div>
              <dt className="text-xs leading-relaxed text-ink-soft">Across the platform</dt>
              <dd
                data-property-total=""
                className="mt-1 font-heading text-2xl font-bold tabular-nums text-ink"
              >
                {stock ? stock.total.toLocaleString("en-GB") : "Unavailable"}
              </dd>
            </div>
          </dl>
          {selectedName === "Unmapped" ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              These listings have no regional assignment, so they have no map marker.
            </p>
          ) : null}
        </div>

        <p
          data-stock-status={status}
          role="status"
          className="mt-4 text-xs leading-relaxed text-ink-soft"
        >
          {status === "unavailable"
            ? stock
              ? "Current refresh unavailable. Showing the last recorded counts."
              : "Current property counts are unavailable."
            : status === "snapshot"
              ? "Showing a dated public snapshot."
              : "Latest public counts received."}
          {stock ? (
            <>
              <br />
              <time data-stock-as-of="" dateTime={stock.asOf}>
                {formatAsOf(stock.asOf)}
              </time>
            </>
          ) : null}
        </p>

        <details className="group mt-3 border-t border-rule">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600">
            What these counts include
            <span
              aria-hidden="true"
              className="text-lg group-open:rotate-45 motion-safe:transition-transform"
            >
              +
            </span>
          </summary>
          <div className="space-y-3 pb-1 text-sm leading-relaxed text-ink-soft">
            <p>
              {stock?.basis ??
                "The public aggregate source could not be loaded. Missing counts are shown as unavailable."}
            </p>
            <p>
              These are property listings, not homes managed or people housed. Housing need is
              separate from property availability; the background does not measure demand.
            </p>
            <p>
              Areas follow the platform's regional groups, including its separate Lincolnshire
              group. Listings without a region are included under Unmapped.
            </p>
            <p>
              Source:{" "}
              <a
                href={PUBLIC_PROPERTY_STOCK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-teal-600 underline underline-offset-4"
              >
                IIG public property counts<span className="sr-only"> (opens in a new tab)</span>
              </a>
              . Refreshes every five minutes while this page is visible. UK outline: Natural Earth.
            </p>
          </div>
        </details>
      </aside>
    </div>
  );
}
