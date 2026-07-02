import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { join, basename, extname } from "path";
import { EPDSchema, EPD_TOOL_SCHEMA } from "./schema";
import { SYSTEM_PROMPT, EXTRACTION_PROMPT } from "./prompt";
import type { EPD } from "./schema";

// Load .env.local if present (so ANTHROPIC_API_KEY doesn't have to be set globally)
const envLocalPath = join(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  const lines = readFileSync(envLocalPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const client = new Anthropic();

const EPD_DIR = join(process.cwd(), "EPD");
const DATA_DIR = join(process.cwd(), "data");
const PUBLIC_EPD_DIR = join(process.cwd(), "public", "epd");

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(PUBLIC_EPD_DIR, { recursive: true });

// Slugify PDF filename to a safe JSON/URL identifier
function toSlug(fileName: string): string {
  return basename(fileName, extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

// Sanity check: A1+A2+A3 should approximately equal A1A3 when all three are declared
function sanityCheck(epd: EPD): string[] {
  const warnings: string[] = [];
  for (const gwpKey of ["gwp_total", "gwp_fossil", "gwp_biogenic"] as const) {
    const breakdown = epd.carbon[gwpKey];
    const { A1, A2, A3, A1A3 } = breakdown;
    if (
      A1.status === "declared" && A1.value !== null &&
      A2.status === "declared" && A2.value !== null &&
      A3.status === "declared" && A3.value !== null &&
      A1A3.status === "declared" && A1A3.value !== null
    ) {
      const sum = A1.value + A2.value + A3.value;
      const pctDiff = Math.abs(sum - A1A3.value) / Math.abs(A1A3.value);
      if (pctDiff > 0.02) {
        warnings.push(
          `${gwpKey}: A1(${A1.value}) + A2(${A2.value}) + A3(${A3.value}) = ${sum.toFixed(3)}, ` +
          `but A1A3 = ${A1A3.value} (${(pctDiff * 100).toFixed(1)}% diff > 2% tolerance)`
        );
      }
    }
  }
  return warnings;
}

async function extractEPD(pdfPath: string): Promise<EPD | null> {
  const fileName = basename(pdfPath);
  const slug = toSlug(fileName);
  console.log(`\n→ Extracting: ${fileName}`);

  // Check if already extracted
  const outPath = join(DATA_DIR, `${slug}.json`);
  try {
    const existing = JSON.parse(readFileSync(outPath, "utf-8"));
    console.log(`  ✓ Already extracted, skipping (delete ${slug}.json to re-run)`);
    return existing as EPD;
  } catch {
    // not yet extracted, proceed
  }

  const pdfBytes = readFileSync(pdfPath);
  const base64 = pdfBytes.toString("base64");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "extract_epd",
        description: "Extract all EPD structured data from the PDF document",
        input_schema: EPD_TOOL_SCHEMA,
      },
    ],
    tool_choice: { type: "any" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: EXTRACTION_PROMPT(fileName),
          },
        ],
      },
    ],
  });

  // Find the tool use block
  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    console.error(`  ✗ No tool call returned for ${fileName}`);
    return null;
  }

  // Inject file_name (we know it; saves the model from guessing)
  const raw = toolUse.input as Record<string, unknown>;
  if (raw.source && typeof raw.source === "object") {
    (raw.source as Record<string, unknown>).file_name = fileName;
  }

  // Validate against Zod schema
  const result = EPDSchema.safeParse(raw);
  if (!result.success) {
    console.error(`  ✗ Schema validation failed for ${fileName}:`);
    console.error(JSON.stringify(result.error.issues, null, 2));
    // Write raw for inspection
    writeFileSync(outPath.replace(".json", ".raw.json"), JSON.stringify(raw, null, 2), "utf-8");
    return null;
  }

  const epd = result.data;

  // Sanity checks
  const warnings = sanityCheck(epd);
  if (warnings.length > 0) {
    console.warn(`  ⚠ Sanity check warnings for ${fileName}:`);
    warnings.forEach((w) => console.warn(`    - ${w}`));
  }

  // Write validated JSON
  writeFileSync(outPath, JSON.stringify(epd, null, 2), "utf-8");
  console.log(`  ✓ Wrote ${outPath}`);

  // Copy PDF to public/epd for provenance links
  const publicPath = join(PUBLIC_EPD_DIR, fileName);
  copyFileSync(pdfPath, publicPath);

  return epd;
}

async function main() {
  const pdfFiles = readdirSync(EPD_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort()
    .map((f) => join(EPD_DIR, f));

  console.log(`Found ${pdfFiles.length} EPD PDFs to process`);

  let success = 0;
  let failed = 0;

  for (const pdfPath of pdfFiles) {
    const result = await extractEPD(pdfPath);
    if (result) {
      success++;
    } else {
      failed++;
    }
    // Small delay to be polite to the API
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n=== Extraction complete ===`);
  console.log(`Success: ${success}/${pdfFiles.length}`);
  if (failed > 0) {
    console.log(`Failed: ${failed} — check .raw.json files in /data for inspection`);
  }
}

main().catch(console.error);
