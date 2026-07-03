import { readdirSync, readFileSync } from "fs";
import { join, basename } from "path";
import type { EPD } from "@/extraction/schema";
import type { EPDSummaryRow } from "@/lib/types";

// Load all extracted EPDs from /data at build time (server-only)
export function loadAllEPDs(): Array<{ slug: string; epd: EPD }> {
  const dataDir = join(process.cwd(), "data");
  let files: string[];
  try {
    files = readdirSync(dataDir).filter(
      (f) => f.endsWith(".json") && !f.endsWith(".raw.json")
    );
  } catch {
    return [];
  }

  return files
    .map((file) => {
      try {
        const raw = readFileSync(join(dataDir, file), "utf-8");
        const epd = JSON.parse(raw) as EPD;
        return { slug: basename(file, ".json"), epd };
      } catch {
        return null;
      }
    })
    .filter((x): x is { slug: string; epd: EPD } => x !== null);
}

function toSummaryRow(slug: string, epd: EPD): EPDSummaryRow {
  return {
    slug,
    productName: epd.product.name,
    manufacturer: epd.manufacturer.name,
    city: epd.manufacturer.plant_city,
    state: epd.manufacturer.plant_state,
    strengthMpa: epd.product.compressive_strength_mpa,
    isLowCarbonMix: epd.product.is_low_carbon_mix,
    headlineGwp: epd.summary.headline_gwp_total_a1_a3,
    scopeCoversEOL: epd.summary.scope_covers_end_of_life,
    scopeCoversTransport: epd.summary.scope_covers_transport_to_site,
    scopeCoversInstallation: epd.summary.scope_covers_installation,
  };
}

export function getAllSummaryRows(): EPDSummaryRow[] {
  return loadAllEPDs()
    .map(({ slug, epd }) => toSummaryRow(slug, epd))
    .sort((a, b) => (a.headlineGwp ?? Infinity) - (b.headlineGwp ?? Infinity));
}

export function getEPDBySlug(slug: string): EPD | null {
  const all = loadAllEPDs();
  const found = all.find((x) => x.slug === slug);
  return found?.epd ?? null;
}

// Unique location values for the filter dropdown
export function getLocationOptions(): string[] {
  const rows = getAllSummaryRows();
  const locations = new Set<string>();
  for (const row of rows) {
    const loc = [row.city, row.state].filter(Boolean).join(", ");
    if (loc) locations.add(loc);
  }
  return Array.from(locations).sort();
}
