// Re-export types derived from the Zod schema so app code doesn't import from extraction/
export type { EPD, ModuleValue, ModuleStatus, GWPBreakdown } from "@/extraction/schema";

// Convenience type for the per-product list view
export type EPDSummaryRow = {
  slug: string;
  productName: string;
  manufacturer: string;
  city: string;
  state: string | null;
  strengthMpa: number | null;
  strengthClass: string | null;
  isLowCarbonMix: boolean;
  headlineGwp: number | null; // kg CO₂e per m³, A1-A3
  scopeCoversEOL: boolean;
  scopeCoversTransport: boolean;
  scopeCoversInstallation: boolean;
  programOperator: string;
  validUntil: string;
  comparabilityNotes: string;
  pdfFileName: string;
};

export type FilterState = {
  search: string;
  strengthMpa: string;
  location: string;
};
