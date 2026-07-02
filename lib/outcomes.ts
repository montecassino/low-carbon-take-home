import type { EPD } from "@/extraction/schema";

export type Outcome = {
  icon: string;
  title: string;
  body: string;
  kind: "good" | "caution" | "info" | "neutral";
};

export const EQUIVALENCIES = {
  CAR_KG_PER_KM: 0.21,
  FLIGHT_SYD_MEL_KG: 150,
};

export function getProductOutcomes(epd: EPD): Outcome[] {
  const outcomes: Outcome[] = [];
  const mpa = epd.product.compressive_strength_mpa;
  const isLowCarbon = epd.product.is_low_carbon_mix;
  const coversTransport = epd.summary.scope_covers_transport_to_site;
  const coversEOL = epd.summary.scope_covers_end_of_life;
  const dValue = epd.carbon.gwp_total.D;

  if (mpa !== null) {
    if (mpa <= 32) {
      outcomes.push({
        icon: "🏗",
        title: "Suitable for: general construction",
        body: `At ${mpa} MPa, this is a standard structural grade — appropriate for house slabs, footings, driveways, retaining walls, and low-rise building elements.`,
        kind: "good",
      });
    } else {
      outcomes.push({
        icon: "🏢",
        title: "Suitable for: higher-strength structural work",
        body: `At ${mpa} MPa, this mix is designed for columns, transfer slabs, and multi-storey elements where loads are concentrated. Using it for a driveway or garden path would be over-specifying.`,
        kind: "info",
      });
    }
  }

  if (isLowCarbon) {
    outcomes.push({
      icon: "🌿",
      title: "Lower-carbon mix: formwork stays up a little longer",
      body: "This product replaces some Portland cement with slag or fly ash, which lowers carbon. The trade-off: strength gains more slowly in the first few days, so formwork may need to stay 1–2 extra days before stripping. Long-term strength is equal or better.",
      kind: "caution",
    });
  }

  if (!coversTransport) {
    outcomes.push({
      icon: "🚛",
      title: "Delivery emissions not included in this EPD",
      body: `This EPD stops at the factory gate — trucking to your site (module A4) is not included. A typical delivery adds roughly 3–8 kg CO₂ per m³. The further your site is from ${epd.manufacturer.plant_city}, the more this matters.`,
      kind: "caution",
    });
  } else {
    outcomes.push({
      icon: "🚛",
      title: "Delivery emissions are included",
      body: "This EPD includes transport to site (module A4), so the headline number already accounts for delivery — a more complete figure than factory-gate-only EPDs.",
      kind: "good",
    });
  }

  if (coversEOL) {
    const recyclingCredit = dValue.status === "declared" && dValue.value !== null && dValue.value < 0;
    if (recyclingCredit) {
      outcomes.push({
        icon: "🔄",
        title: "Recyclable at end of life — earns a carbon credit",
        body: `When demolished, this concrete can be crushed and reused as gravel. Module D shows ${dValue.value!.toFixed(1)} kg CO₂e/m³ as a recycling credit (shown in green on the stage chart).`,
        kind: "good",
      });
    }
  } else {
    outcomes.push({
      icon: "🔄",
      title: "End-of-life recyclability not declared",
      body: "This EPD doesn't report demolition or recycling scenarios. Concrete is generally recyclable, but without the data we can't quantify the benefit — missing data is not zero.",
      kind: "caution",
    });
  }

  return outcomes;
}

export function getProjectCarbonImpact(gwpPerM3: number, volumeM3: number) {
  const totalKg = gwpPerM3 * volumeM3;
  return {
    totalKg,
    carKm: Math.round(totalKg / EQUIVALENCIES.CAR_KG_PER_KM),
    flights: +(totalKg / EQUIVALENCIES.FLIGHT_SYD_MEL_KG).toFixed(1),
  };
}

export const PROJECT_PRESETS: Array<{ label: string; m3: number; description: string }> = [
  { label: "Driveway (50 m²)", m3: 7.5, description: "50 m² at 150 mm thick" },
  { label: "House slab (100 m²)", m3: 15, description: "100 m² at 150 mm thick" },
  { label: "Custom", m3: 0, description: "Enter your own volume" },
];
