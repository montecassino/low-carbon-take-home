# Low Carbon Materials Hub

A tool for comparing embodied carbon in concrete products, built from Environmental Product Declarations (EPDs).

Every carbon figure is traceable to its source EPD. A value marked **Not reported** means data was not declared in the document — it is not zero.

**Live demo:** [Deployed on Vercel](https://low-carbon-take-home.vercel.app/) 
---

## What it does

**Compare table** (`/`)
- Browse all 20 concrete products — default sort is embodied carbon (A1–A3), or sort by compressive strength
- Filter by search (product or manufacturer), compressive strength (MPa dropdown), and manufacturing location
- See scope coverage at a glance — which products report delivery, installation, and end-of-life data
- Tick any two products to launch a side-by-side comparison

**Side-by-side comparison** (`/compare`)
- Plain-English recommendation: which product produces less carbon, by how much, and why
- **Project impact calculator** — pick a project size (driveway, house slab, or custom m³) and see total CO₂ for each product with everyday equivalencies: km driven in a petrol car and Sydney–Melbourne return flights
- Side-by-side product cards with key specs and scope coverage
- Stage-by-stage carbon table showing every life-cycle module side by side with the difference column
- Source traceability: EPD registration, operator, validity, and a link to the source PDF (local dev only — see Setup)

**Product detail page** (`/product/[slug]`)
- Full life-cycle bar charts for GWP-total, GWP-fossil, and GWP-biogenic — stage by stage
- "What this means for your project" outcome cards in plain English
- Every "Not reported" stage shown explicitly — never as zero
- Module D recycling credits shown in green (negative = benefit, not error)
- Provenance card linking directly to the source EPD PDF

---

## Plain-English guide to the numbers and jargon

If you've never worked with construction environmental data before, here's everything you need to read the app without getting lost.

### What is an EPD?

An **EPD (Environmental Product Declaration)** is a standardised report — like a nutrition label — that tells you the environmental impact of a building material. Every number in this app comes from a third-party verified EPD. The supplier cannot publish the numbers without an independent auditor signing off on them.

### What is "embodied carbon"?

**Embodied carbon** is the total greenhouse gas emitted to manufacture and deliver the concrete — before a single person walks on it. It's measured in **kg CO₂e** (kilograms of CO₂-equivalent) per cubic metre of concrete. Lower is better when comparing products with the same strength.

In EPD tables this is called **GWP-total** (Global Warming Potential). The app shows three flavours:

| Label in the app | What it means in plain English |
|---|---|
| **GWP – Total** | All greenhouse gases combined. This is the headline number. |
| **GWP – Fossil** | The portion from burning fossil fuels and industrial processes (cement kilns, trucks, etc.) |
| **GWP – Biogenic** | The portion from biological sources (wood waste, biomass). Almost always near-zero for concrete. |

### What is a "life-cycle stage"?

Every EPD splits the carbon into stages — like chapters of the product's story from birth to demolition. The app shows them as bars in the stage-by-stage chart.

| Stage | Plain name | What happens |
|---|---|---|
| **A1** | Raw materials | Quarrying sand and gravel, making cement, slag, and additives |
| **A2** | Inbound transport | Trucks carrying ingredients to the mixing plant |
| **A3** | Manufacturing | Mixing at the plant; energy used; waste at the plant |
| **A1–A3** | Manufacturing (combined) | Some EPDs only report A1–A3 as a single number, not broken out |
| **A4** | Delivery to site | The concrete truck driving to your construction site |
| **A5** | Installation | Pumping and placing the concrete on site |
| **B1–B7** | In service | The building while it's being used (rarely reported for concrete) |
| **C1** | Demolition | Breaking up the old building |
| **C2** | Waste transport | Trucking the rubble to a recycling or disposal facility |
| **C3** | Waste processing | Crushing demolished concrete into gravel |
| **C4** | Landfill | Whatever can't be recycled, sent to landfill |
| **D** | Recycling credit | The environmental *benefit* of crushed concrete replacing virgin gravel in future projects |

**Cradle-to-gate** means the EPD only covers A1–A3 (from raw materials to when the truck leaves the factory gate). Many EPDs stop there.

**Cradle-to-grave** includes C1–C4 (all the way through demolition and disposal) and sometimes D (the recycling benefit).

### Why does module D sometimes show a negative number?

A negative value in module D is a good thing. It represents a carbon *credit* — crushed demolished concrete can replace quarried gravel in new projects, avoiding the environmental cost of mining new material. It's not "negative pollution"; it's a future benefit sitting outside the main footprint.

### What does "Not reported" mean?

When the app shows **Not reported** (or an amber badge), it means the supplier did not include that stage in their EPD. **This is not the same as zero.** A stage that wasn't reported could have significant carbon — we simply don't know. The app never shows ND as 0 because that would give a false impression of lower carbon.

### What is compressive strength (MPa)?

**MPa (megapascals)** is the load rating of concrete — how much weight it can bear before it crushes. Think of it like the structural "grade" of the product. 32 MPa is a common general-purpose grade; 50 MPa is high-strength. You should only compare embodied carbon between products of similar strength, because a weaker mix will naturally look better on carbon but can't do the same job.

### Why can't I just compare every product directly?

Two reasons:

1. **Different scopes** — one EPD might include delivery (A4) and installation (A5); another might stop at the factory gate (A1–A3). Adding those extra stages always increases the reported carbon, so a product that looks "higher" might just be reporting more honestly.
2. **Different rulebooks** — EPDs follow "product category rules" (PCRs) that specify what to measure and how. EPDs from different programs (EPD Hub vs. EPD Australasia vs. The International EPD System) may use slightly different rules. The app flags these differences in the comparability note on each product's detail page.

The most reliable comparison uses the **A1–A3 column** (manufacturing only) because every product in this dataset declares it and it follows the same scope boundary.

### What is "A1–A3 specific data %"?

This tells you how much of the manufacturing data came from the actual plant (measured on-site) versus generic industry averages. A figure of 98% means almost all the data is supplier-specific and therefore more accurate for that product. A lower figure means more assumptions were used.

### Scope coverage icons

On every product row you'll see small pills showing which stages the EPD covers:

| Pill | Meaning |
|---|---|
| **A1–A3** | Manufacturing — always covered |
| **A4** | Delivery to site — only some EPDs include this |
| **A5** | Installation — only some EPDs include this |
| **C+D** | End of life + recycling credit — only some EPDs include this |

An active (coloured) pill means covered. A grey pill means not reported in that EPD.

---

## Project structure

```
/EPD/                     20 source EPD PDFs (committed — used by extraction)
/data/                    Extracted JSON files (one per EPD) — committed, app data source
/extraction/
  schema.ts               Zod schema — the contract for every extracted EPD
  prompt.ts               System + user prompt for Claude Sonnet 4.6
  extract.ts              Extraction script (run once, writes /data and local PDF copies)
/lib/
  data.ts                 Load and filter EPD data at build time
  types.ts                TypeScript types derived from Zod schema
  recommendation.ts       Plain-English verdict logic for the compare page
  outcomes.ts             Per-product outcome descriptions and impact calculator logic
/app/
  page.tsx                Main compare table with filters and checkbox selection
  compare/                Side-by-side comparison + recommendation + impact calculator
  product/[slug]/         Product detail: life-cycle charts + outcomes + provenance
/components/
  CompareTable.tsx        Filterable, sortable table with floating compare bar
  FilterBar.tsx           Search, strength (MPa), and location filters
  LifeCycleChart.tsx      CSS bar chart of GWP by life-cycle stage
  ImpactCalculator.tsx    Interactive project-size carbon calculator
  OutcomeCards.tsx        Plain-English outcome description cards
  GwpBadge.tsx            ND / NR / declared value display
  ScopeIcons.tsx          A1-A3 / A4 / A5 / C+D coverage pills
/public/epd/              PDF copies for local provenance links (gitignored — not pushed)
EXTRACTION.md             Written reasoning about the extraction strategy
```

**What gets pushed to GitHub:** `/data/` JSON and `/EPD/` source PDFs. **`/public/epd/` is gitignored** — the extraction script still copies PDFs there for local "view source PDF" links, but they are not in the remote repo.

---

## Setup

### Prerequisites
- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/) (for extraction only — not needed to run the app)

### Install dependencies
```bash
npm install
```

### Step 1: Extract EPD data (run once)
```bash
# Set your Anthropic API key
$env:ANTHROPIC_API_KEY = "sk-ant-..."   # PowerShell
# or
export ANTHROPIC_API_KEY="sk-ant-..."   # bash/zsh

npm run extract
```

This reads every PDF in `/EPD/`, calls Claude Sonnet 4.6 for each, validates the response against the Zod schema, and writes `/data/<slug>.json`. It also copies PDFs to `/public/epd/` for local provenance links (that folder is gitignored and won't be pushed).

Re-running skips already-extracted files. Delete a `.json` file in `/data/` to force re-extraction of that EPD.

**You don't need to re-run extraction** to run or deploy the app — the extracted JSON in `/data/` is already committed. Re-run only if you add new PDFs or want to refresh local PDF links in `/public/epd/`.

### Step 2: Run the app
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production
```bash
npm run build
npm start
```

---

## Deploy to Vercel

1. Push the repo to GitHub. The app reads from `/data/` at build time — no API key needed on Vercel.
2. Import the repo in [Vercel](https://vercel.com).
3. No environment variables needed for the deployed app (extraction is offline).
4. Deploy — Vercel auto-detects Next.js.

**Note:** "View source PDF" links point to `/public/epd/`, which is not deployed from GitHub. The live site still shows all carbon data and comparisons from `/data/`; only the PDF click-through requires running `npm run extract` locally.

---

## Extraction details

See [EXTRACTION.md](EXTRACTION.md) for the full strategy, model choice, accuracy reasoning, and process notes.

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | Static site generation — no server needed at runtime |
| Styling | Tailwind CSS v4 | CSS-first config, no `tailwind.config.js` required |
| Language | TypeScript (strict) | Types derived from the Zod schema, shared across extraction and app |
| Extraction model | Claude Sonnet 4.6 | Native PDF input, forced tool-use for structured output, ~$2 for all 20 EPDs |
| Schema validation | Zod | Single source of truth — validates LLM output and generates TS types |
| Deployment | Vercel | Zero-config Next.js hosting |

---

## How the recommendation logic works

The plain-English verdict on the compare page (`lib/recommendation.ts`) follows this decision tree:

1. **Can we compare?** If either product is missing A1–A3 GWP data, we say so clearly rather than guessing.
2. **Same strength?** If the two products differ by 5+ MPa, a caveat flags this — a weaker mix often shows lower carbon but may not suit the same structural job.
3. **Close enough to be a tie?** If the difference is within 3% (normal LCA measurement uncertainty), we call it a tie and recommend choosing on price, location, or lead time instead.
4. **Clear winner?** We name the lower-carbon product, state the saving in kg CO₂/m³ and as a percentage (relative to the higher-carbon product).

The impact calculator (`lib/outcomes.ts`) uses these equivalencies:

| Equivalency | Value | Source |
|---|---|---|
| Petrol car emissions | 0.21 kg CO₂/km | Australian average |
| Sydney–Melbourne return flight | 150 kg CO₂/person | Common LCA reference |

---

## One hard rule

Every carbon figure must be traceable to its source EPD. A number with no provenance is worse than no number, because someone will make a real procurement decision on it.
