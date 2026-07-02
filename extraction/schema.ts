import { z } from "zod";

// Every carbon data point carries a status so "not declared" is never silently zero.
export const ModuleStatusSchema = z.enum([
  "declared",           // number present and included in scope
  "not_declared",       // ND — stage was excluded; NOT the same as zero
  "not_relevant",       // NR — stage does not apply to this product type
  "not_separately_reported", // aggregate only (e.g. A1-A3 given, A1/A2/A3 not broken out)
]);
export type ModuleStatus = z.infer<typeof ModuleStatusSchema>;

export const ModuleValueSchema = z.object({
  status: ModuleStatusSchema,
  value: z.number().nullable(),
});
export type ModuleValue = z.infer<typeof ModuleValueSchema>;

// All life-cycle modules across EN 15804+A2
export const GWPBreakdownSchema = z.object({
  A1: ModuleValueSchema,
  A2: ModuleValueSchema,
  A3: ModuleValueSchema,
  A1A3: ModuleValueSchema,  // always populated even if A1/A2/A3 are aggregate-only
  A4: ModuleValueSchema,
  A5: ModuleValueSchema,
  B1: ModuleValueSchema,
  B2: ModuleValueSchema,
  B3: ModuleValueSchema,
  B4: ModuleValueSchema,
  B5: ModuleValueSchema,
  B6: ModuleValueSchema,
  B7: ModuleValueSchema,
  C1: ModuleValueSchema,
  C2: ModuleValueSchema,
  C3: ModuleValueSchema,
  C4: ModuleValueSchema,
  D: ModuleValueSchema,     // may be negative (recycling credit) — that's correct
});
export type GWPBreakdown = z.infer<typeof GWPBreakdownSchema>;

export const EPDSchema = z.object({
  source: z.object({
    file_name: z.string(),
    epd_registration_number: z.string(),
    program_operator: z.string(),
    pcr: z.string(),
    reference_standard: z.string(),
    publication_date: z.string(),
    valid_until: z.string(),
    geographical_scope: z.string(),
    verification: z.enum(["internal", "external", "not_stated"]),
    scope_description: z.string(), // e.g. "Cradle to gate with options, A4-A5, C1-C4, D"
    impact_table_page_refs: z.string(), // e.g. "pages 9-11"
  }),

  manufacturer: z.object({
    name: z.string(),
    plant_address: z.string(),
    plant_city: z.string(),
    plant_state: z.string().nullable(),
    plant_country: z.string().default("Australia"),
  }),

  product: z.object({
    name: z.string(),
    concrete_type: z.string(),      // e.g. "Ready-mix concrete"
    compressive_strength_mpa: z.number().nullable(),
    compressive_strength_class: z.string().nullable(), // e.g. "N32", "32 MPa"
    strength_age_days: z.number().nullable(),
    exposure_class: z.string().nullable(),
    application: z.string(),
    product_standards: z.array(z.string()),
    is_low_carbon_mix: z.boolean(), // true when product name signals greencrete/ecopact/envirocrete etc.
  }),

  declared_unit: z.object({
    unit: z.string().default("1 m³"),
    mass_kg: z.number().nullable(),
    a1_a3_specific_data_pct: z.number().nullable(), // % of A1-A3 data from specific (vs generic) sources
  }),

  carbon: z.object({
    gwp_total: GWPBreakdownSchema,
    gwp_fossil: GWPBreakdownSchema,
    gwp_biogenic: GWPBreakdownSchema,
  }),

  // Summary helpers — derived by extraction, not calculated by us post-hoc
  summary: z.object({
    headline_gwp_total_a1_a3: z.number().nullable(),  // the primary comparable number
    scope_covers_end_of_life: z.boolean(),
    scope_covers_transport_to_site: z.boolean(),
    scope_covers_installation: z.boolean(),
    comparability_notes: z.string(), // any caveats the LLM flags (PCR, scope, grouping)
  }),
});

export type EPD = z.infer<typeof EPDSchema>;

// The shape used as a Claude tool parameter schema (JSON Schema subset)
export const EPD_TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    source: {
      type: "object",
      properties: {
        file_name: { type: "string" },
        epd_registration_number: { type: "string" },
        program_operator: { type: "string" },
        pcr: { type: "string" },
        reference_standard: { type: "string" },
        publication_date: { type: "string" },
        valid_until: { type: "string" },
        geographical_scope: { type: "string" },
        verification: { type: "string", enum: ["internal", "external", "not_stated"] },
        scope_description: { type: "string" },
        impact_table_page_refs: { type: "string" },
      },
      required: [
        "file_name", "epd_registration_number", "program_operator", "pcr",
        "reference_standard", "publication_date", "valid_until",
        "geographical_scope", "verification", "scope_description", "impact_table_page_refs",
      ],
    },
    manufacturer: {
      type: "object",
      properties: {
        name: { type: "string" },
        plant_address: { type: "string" },
        plant_city: { type: "string" },
        plant_state: { type: ["string", "null"] },
        plant_country: { type: "string" },
      },
      required: ["name", "plant_address", "plant_city", "plant_state", "plant_country"],
    },
    product: {
      type: "object",
      properties: {
        name: { type: "string" },
        concrete_type: { type: "string" },
        compressive_strength_mpa: { type: ["number", "null"] },
        compressive_strength_class: { type: ["string", "null"] },
        strength_age_days: { type: ["number", "null"] },
        exposure_class: { type: ["string", "null"] },
        application: { type: "string" },
        product_standards: { type: "array", items: { type: "string" } },
        is_low_carbon_mix: { type: "boolean" },
      },
      required: [
        "name", "concrete_type", "compressive_strength_mpa", "compressive_strength_class",
        "strength_age_days", "exposure_class", "application", "product_standards", "is_low_carbon_mix",
      ],
    },
    declared_unit: {
      type: "object",
      properties: {
        unit: { type: "string" },
        mass_kg: { type: ["number", "null"] },
        a1_a3_specific_data_pct: { type: ["number", "null"] },
      },
      required: ["unit", "mass_kg", "a1_a3_specific_data_pct"],
    },
    carbon: {
      type: "object",
      properties: {
        gwp_total: { $ref: "#/$defs/gwp_breakdown" },
        gwp_fossil: { $ref: "#/$defs/gwp_breakdown" },
        gwp_biogenic: { $ref: "#/$defs/gwp_breakdown" },
      },
      required: ["gwp_total", "gwp_fossil", "gwp_biogenic"],
    },
    summary: {
      type: "object",
      properties: {
        headline_gwp_total_a1_a3: { type: ["number", "null"] },
        scope_covers_end_of_life: { type: "boolean" },
        scope_covers_transport_to_site: { type: "boolean" },
        scope_covers_installation: { type: "boolean" },
        comparability_notes: { type: "string" },
      },
      required: [
        "headline_gwp_total_a1_a3", "scope_covers_end_of_life",
        "scope_covers_transport_to_site", "scope_covers_installation", "comparability_notes",
      ],
    },
  },
  required: ["source", "manufacturer", "product", "declared_unit", "carbon", "summary"],
  $defs: {
    gwp_breakdown: {
      type: "object",
      properties: Object.fromEntries(
        ["A1","A2","A3","A1A3","A4","A5","B1","B2","B3","B4","B5","B6","B7","C1","C2","C3","C4","D"].map(
          (m) => [m, {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["declared","not_declared","not_relevant","not_separately_reported"],
              },
              value: { type: ["number", "null"] },
            },
            required: ["status", "value"],
          }]
        )
      ),
      required: ["A1","A2","A3","A1A3","A4","A5","B1","B2","B3","B4","B5","B6","B7","C1","C2","C3","C4","D"],
    },
  },
};
