import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getEPDBySlug } from "@/lib/data";
import { generateRecommendation } from "@/lib/recommendation";
import { ScopeIcons } from "@/components/ScopeIcons";
import { ImpactCalculator } from "@/components/ImpactCalculator";
import type { EPD } from "@/extraction/schema";
import type { GWPBreakdown } from "@/lib/types";

type Module = keyof GWPBreakdown;

const KEY_MODULES: Array<{ key: Module; label: string }> = [
  { key: "A1A3", label: "A1–A3 Manufacturing" },
  { key: "A4", label: "A4 Delivery to site" },
  { key: "A5", label: "A5 Installation" },
  { key: "C1", label: "C1 Demolition" },
  { key: "C2", label: "C2 Waste transport" },
  { key: "C3", label: "C3 Waste processing" },
  { key: "C4", label: "C4 Landfill" },
  { key: "D", label: "D Recycling credit" },
];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  if (!a || !b) redirect("/");

  const epdA = getEPDBySlug(a);
  const epdB = getEPDBySlug(b);

  if (!epdA || !epdB) notFound();

  const labelA = epdA.product.name;
  const labelB = epdB.product.name;
  const rec = generateRecommendation(epdA, labelA, epdB, labelB);

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-carbon-600 hover:underline">
          ← Back to all products
        </Link>
        <span className="text-sm text-gray-400">Side-by-side comparison</span>
      </div>

      {/* Recommendation verdict */}
      <VerdictCard rec={rec} epdA={epdA} epdB={epdB} labelA={labelA} labelB={labelB} />

      {/* Impact calculator */}
      <ImpactCalculator
        labelA={labelA}
        labelB={labelB}
        gwpA={epdA.summary.headline_gwp_total_a1_a3}
        gwpB={epdB.summary.headline_gwp_total_a1_a3}
      />

      {/* Side-by-side specs */}
      <div className="grid grid-cols-2 gap-4">
        <ProductCard epd={epdA} label="A" slug={a} highlight={rec.winner === "A"} />
        <ProductCard epd={epdB} label="B" slug={b} highlight={rec.winner === "B"} />
      </div>

      {/* Carbon breakdown table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Carbon by life-cycle stage</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            kg CO₂e per m³ — GWP-total. Amber cells mean data was not reported in that EPD (not zero).
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-6 py-3 text-left w-48">Stage</th>
              <th className={`px-6 py-3 text-right ${rec.winner === "A" ? "text-carbon-700" : ""}`}>
                {labelA}
                {rec.winner === "A" && <span className="ml-1 text-green-600">✓ lower carbon</span>}
              </th>
              <th className={`px-6 py-3 text-right ${rec.winner === "B" ? "text-carbon-700" : ""}`}>
                {labelB}
                {rec.winner === "B" && <span className="ml-1 text-green-600">✓ lower carbon</span>}
              </th>
              <th className="px-6 py-3 text-right text-gray-400">Difference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {KEY_MODULES.map(({ key, label }) => {
              const mvA = epdA.carbon.gwp_total[key];
              const mvB = epdB.carbon.gwp_total[key];
              const valA = mvA.status === "declared" ? mvA.value : null;
              const valB = mvB.status === "declared" ? mvB.value : null;
              const diff =
                valA !== null && valB !== null ? valA - valB : null;

              const aIsBetter =
                diff !== null &&
                (key === "D" ? diff > 0 : diff < 0); // D is a credit, so lower (more negative) is better for the product
              const bIsBetter = diff !== null && !aIsBetter && diff !== 0;

              return (
                <tr key={key} className={key === "A1A3" ? "bg-carbon-50 font-medium" : ""}>
                  <td className="px-6 py-3 text-gray-600 text-xs">{label}</td>
                  <td className={`px-6 py-3 text-right tabular-nums ${aIsBetter ? "text-green-700 font-semibold" : ""}`}>
                    <CellValue mv={mvA} />
                  </td>
                  <td className={`px-6 py-3 text-right tabular-nums ${bIsBetter ? "text-green-700 font-semibold" : ""}`}>
                    <CellValue mv={mvB} />
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums text-gray-400">
                    {diff !== null ? (
                      <span className={Math.abs(diff) < 0.01 ? "text-gray-300" : diff < 0 ? "text-green-600" : "text-red-400"}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-200">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400">
          Difference = A minus B. Negative = A is lower carbon for that stage.
          Module D is a recycling credit — more negative is better.
        </div>
      </div>

      {/* Source links */}
      <div className="grid grid-cols-2 gap-4">
        <SourceCard epd={epdA} label="A" />
        <SourceCard epd={epdB} label="B" />
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function VerdictCard({
  rec,
  epdA,
  epdB,
  labelA,
  labelB,
}: {
  rec: ReturnType<typeof generateRecommendation>;
  epdA: EPD;
  epdB: EPD;
  labelA: string;
  labelB: string;
}) {
  const bgClass =
    rec.verdict === "a_wins"
      ? "bg-green-50 border-green-200"
      : rec.verdict === "b_wins"
      ? "bg-green-50 border-green-200"
      : rec.verdict === "tie"
      ? "bg-blue-50 border-blue-200"
      : "bg-amber-50 border-amber-200";

  const iconClass =
    rec.verdict === "not_comparable"
      ? "text-amber-500"
      : rec.verdict === "tie"
      ? "text-blue-500"
      : "text-green-600";

  const icon =
    rec.verdict === "not_comparable"
      ? "⚠"
      : rec.verdict === "tie"
      ? "≈"
      : "✓";

  return (
    <div className={`rounded-xl border-2 p-6 ${bgClass}`}>
      <div className="flex items-start gap-3">
        <span className={`text-2xl font-bold ${iconClass}`}>{icon}</span>
        <div className="space-y-3 flex-1">
          <p className="text-lg font-bold text-gray-900">{rec.headline}</p>

          {rec.reasoning.length > 0 && (
            <ul className="space-y-1.5">
              {rec.reasoning.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-gray-400 shrink-0">•</span>
                  {r}
                </li>
              ))}
            </ul>
          )}

          {rec.caveats.length > 0 && (
            <div className="rounded-md bg-white/60 p-3 space-y-1.5 mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Before you decide</p>
              {rec.caveats.map((c, i) => (
                <p key={i} className="text-xs text-gray-600">
                  <span className="font-medium">⚑</span> {c}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  epd,
  label,
  slug,
  highlight,
}: {
  epd: EPD;
  label: string;
  slug: string;
  highlight: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-white p-5 shadow-sm ${highlight ? "border-green-300 ring-1 ring-green-200" : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${highlight ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {label}
        </span>
        {highlight && (
          <span className="text-xs font-semibold text-green-600">Lower carbon</span>
        )}
      </div>
      <h3 className="mt-2 font-semibold text-gray-900 leading-snug">{epd.product.name}</h3>
      <p className="text-sm text-gray-500">{epd.manufacturer.name}</p>
      <p className="text-xs text-gray-400">
        {[epd.manufacturer.plant_city, epd.manufacturer.plant_state].filter(Boolean).join(", ")}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Stat
          label="Embodied carbon (A1–A3)"
          value={
            epd.summary.headline_gwp_total_a1_a3 !== null
              ? `${epd.summary.headline_gwp_total_a1_a3.toFixed(0)} kg CO₂e/m³`
              : "Not reported"
          }
          large
          highlight={highlight}
        />
        <Stat
          label="Strength"
          value={
            epd.product.compressive_strength_mpa
              ? `${epd.product.compressive_strength_mpa} MPa`
              : epd.product.compressive_strength_class ?? "—"
          }
        />
        <Stat label="Concrete type" value={epd.product.concrete_type} />
        <Stat
          label="Mass per m³"
          value={epd.declared_unit.mass_kg ? `${epd.declared_unit.mass_kg} kg` : "—"}
        />
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray-400 mb-1">Scope covered</p>
        <ScopeIcons
          coversEOL={epd.summary.scope_covers_end_of_life}
          coversTransport={epd.summary.scope_covers_transport_to_site}
          coversInstallation={epd.summary.scope_covers_installation}
        />
      </div>

      {epd.product.is_low_carbon_mix && (
        <span className="mt-3 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          Low-carbon mix
        </span>
      )}

      <div className="mt-4">
        <Link
          href={`/product/${slug}`}
          className="text-xs text-carbon-600 hover:underline"
        >
          Full stage-by-stage breakdown →
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  large,
  highlight,
}: {
  label: string;
  value: string;
  large?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="col-span-2 sm:col-span-1">
      <p className="text-xs text-gray-400">{label}</p>
      <p
        className={`mt-0.5 font-medium ${
          large
            ? highlight
              ? "text-xl text-green-700"
              : "text-xl text-gray-900"
            : "text-sm text-gray-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CellValue({ mv }: { mv: { status: string; value: number | null } }) {
  if (mv.status === "not_declared") {
    return (
      <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
        Not reported
      </span>
    );
  }
  if (mv.status === "not_separately_reported") {
    return <span className="text-gray-300 text-xs">in A1–A3</span>;
  }
  if (mv.status === "not_relevant" || mv.value === null) {
    return <span className="text-gray-300">—</span>;
  }
  return (
    <span className={mv.value < 0 ? "text-green-600" : ""}>
      {mv.value.toFixed(2)}
    </span>
  );
}

function SourceCard({ epd, label }: { epd: EPD; label: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm text-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Product {label} — Source
      </p>
      <dl className="space-y-1 text-xs text-gray-600">
        <div className="flex gap-2">
          <dt className="text-gray-400 w-24 shrink-0">EPD ID</dt>
          <dd className="font-mono">{epd.source.epd_registration_number}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-400 w-24 shrink-0">Operator</dt>
          <dd>{epd.source.program_operator.split(",")[0]}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-400 w-24 shrink-0">Valid until</dt>
          <dd>{epd.source.valid_until}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-400 w-24 shrink-0">Data page</dt>
          <dd>{epd.source.impact_table_page_refs}</dd>
        </div>
      </dl>
      <a
        href={`/epd/${encodeURIComponent(epd.source.file_name)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs text-carbon-600 hover:underline"
      >
        Open source EPD PDF ↗
      </a>
    </div>
  );
}
