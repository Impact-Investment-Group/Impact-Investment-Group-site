import { apiUrl } from "@/lib/api";

export const PUBLIC_PROPERTY_STOCK_PATH = "/public/showcase-counts";
export const PUBLIC_PROPERTY_STOCK_URL = apiUrl(PUBLIC_PROPERTY_STOCK_PATH);

export interface PropertyStockRegion {
  name: string;
  count: number;
}

export interface PublicPropertyStock {
  asOf: string;
  total: number;
  regions: PropertyStockRegion[];
  basis: string;
  suppressionReason: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/** Accept only the public aggregate contract. Missing data must never become zero. */
export function parsePublicPropertyStock(value: unknown): PublicPropertyStock {
  if (!isRecord(value)) throw new Error("Property counts are unavailable.");

  const asOf = value["as_of"];
  const total = value["total"];
  const rawRegions = value["regions"];
  const basis = value["basis"];
  const suppressionReason = value["suppression_reason"];

  if (
    typeof asOf !== "string" ||
    !/(?:Z|[+-]\d{2}:\d{2})$/i.test(asOf) ||
    !Number.isFinite(Date.parse(asOf)) ||
    !isCount(total) ||
    !isRecord(rawRegions) ||
    typeof basis !== "string" ||
    !basis.trim() ||
    basis.length > 4000 ||
    (suppressionReason !== undefined &&
      suppressionReason !== null &&
      typeof suppressionReason !== "string")
  ) {
    throw new Error("Property counts are unavailable.");
  }

  const regions: PropertyStockRegion[] = [];
  for (const [name, region] of Object.entries(rawRegions)) {
    if (
      !name.trim() ||
      name !== name.trim() ||
      name.length > 80 ||
      !isRecord(region) ||
      !isCount(region["count"])
    ) {
      throw new Error("Regional property counts are unavailable.");
    }
    regions.push({ name, count: region["count"] });
  }

  if (regions.length === 0 || regions.reduce((sum, region) => sum + region.count, 0) !== total) {
    throw new Error("Regional property counts do not match the published total.");
  }

  return {
    asOf,
    total,
    regions,
    basis: basis.trim(),
    // A suppression reason describes public browsing permissions. The approved
    // aggregate remains valid, including listings requiring sign-in to view.
    suppressionReason: typeof suppressionReason === "string" ? suppressionReason : null,
  };
}

export async function fetchPublicPropertyStock(signal: AbortSignal): Promise<PublicPropertyStock> {
  const response = await fetch(PUBLIC_PROPERTY_STOCK_URL, {
    method: "GET",
    credentials: "omit",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error("Property counts could not be refreshed.");
  return parsePublicPropertyStock(await response.json());
}
