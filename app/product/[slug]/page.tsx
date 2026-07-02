import { notFound } from "next/navigation";
import Link from "next/link";
import { loadAllEPDs, getEPDBySlug } from "@/lib/data";
import { LifeCycleChart } from "@/components/LifeCycleChart";
import { ScopeIcons } from "@/components/ScopeIcons";
import { OutcomeCards } from "@/components/OutcomeCards";
import { getProductOutcomes } from "@/lib/outcomes";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const epds = loadAllEPDs();
  return epds.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const epd = getEPDBySlug(slug);
  if (!epd) return {};
  return {
    title: `${epd.product.name} — Low Carbon Materials Hub`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const epd = getEPDBySlug(slug);
  if (!epd) notFound();

  const { source, manufacturer, product, declared_unit, carbon, summary } = epd;
  const outcomes = getProductOutcomes(epd);

  const hasDifferentPCR = summary.comparability_notes.length > 0;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <Link href="/" className="text-sm text-carbon-600 hover:underline">
          ← Back to comparison
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-1 text-gray-600">
              {manufacturer.name} &mdash;{" "}
              {[manufacturer.plant_city, manufacturer.plant_state, manufacturer.plant_country]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
          <div className="text-right">
            {summary.headline_gwp_total_a1_a3 !== null ? (
              <div>
                <span className="text-3xl font-bold text-gray-900">
                  {summary.headline_gwp_total_a1_a3.toFixed(0)}
                </span>
                <span className="ml-1 text-sm text-gray-500">kg CO₂e/m³</span>
                <p className="text-xs text-gray-400">GWP-total, A1–A3 (manufacturing)</p>
              </div>
            ) : (
              <span className="text-sm text-amber-700">A1–A3 not reported</span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Strength</p>
            <p className="font-medium text-gray-900">
              {product.compressive_strength_class ?? product.compressive_strength_mpa ?? "—"}
              {product.compressive_strength_mpa !== null &&
                !product.compressive_strength_class?.includes("MPa") &&
                ` (${product.compressive_strength_mpa} MPa)`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Concrete type</p>
            <p className="text-gray-700">{product.concrete_type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Declared unit</p>
            <p className="text-gray-700">
              {declared_unit.unit}
              {declared_unit.mass_kg !== null && ` (${declared_unit.mass_kg} kg)`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Application</p>
            <p className="text-gray-700">{product.application}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Life-cycle scope covered</p>
          <ScopeIcons
            coversEOL={summary.scope_covers_end_of_life}
            coversTransport={summary.scope_covers_transport_to_site}
            coversInstallation={summary.scope_covers_installation}
          />
          <p className="mt-1 text-xs text-gray-500">{source.scope_description}</p>
        </div>
      </div>

      {/* Comparability banner */}
      {hasDifferentPCR && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <strong>Comparability note:</strong> {summary.comparability_notes}
        </div>
      )}

      {/* Outcome implications */}
      <OutcomeCards
        outcomes={outcomes}
        title="What this means for your project"
      />

      {/* Life-cycle charts */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Carbon breakdown by life-cycle stage</h2>
          <p className="mt-1 text-sm text-gray-500">
            All values in kg CO₂e per {declared_unit.unit}.{" "}
            <span className="text-amber-700">Amber &quot;Not reported&quot;</span> means the stage
            was excluded from this EPD — it is <em>not</em> zero.
            <span className="text-green-700"> Green bars</span> are module D credits (negative = benefit).
          </p>
        </div>

        <LifeCycleChart
          breakdown={carbon.gwp_total}
          title="GWP – Total (Global Warming Potential, all sources)"
        />

        <hr className="border-gray-100" />

        <LifeCycleChart
          breakdown={carbon.gwp_fossil}
          title="GWP – Fossil (from fossil fuels and industrial processes)"
        />

        <hr className="border-gray-100" />

        <LifeCycleChart
          breakdown={carbon.gwp_biogenic}
          title="GWP – Biogenic (from biological carbon sources)"
        />
      </div>

      {/* Provenance card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Source &amp; traceability</h2>
        <p className="mt-1 text-sm text-gray-500">
          Every number above comes from the EPD below. Impact data is on{" "}
          {source.impact_table_page_refs}.
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <ProvItem label="EPD registration" value={source.epd_registration_number} />
          <ProvItem label="Program operator" value={source.program_operator} />
          <ProvItem label="Standard" value={source.reference_standard} />
          <ProvItem label="PCR" value={source.pcr} />
          <ProvItem label="Published" value={source.publication_date} />
          <ProvItem label="Valid until" value={source.valid_until} />
          <ProvItem label="Verification" value={source.verification} />
          {declared_unit.a1_a3_specific_data_pct !== null && (
            <ProvItem
              label="A1–A3 specific data"
              value={`${declared_unit.a1_a3_specific_data_pct}% from plant-specific measurements`}
            />
          )}
        </dl>
        <div className="mt-4">
          <a
            href={`/epd/${encodeURIComponent(source.file_name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-carbon-600 px-4 py-2 text-sm font-medium text-white hover:bg-carbon-700 transition-colors"
          >
            Open source EPD PDF
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function ProvItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-gray-800">{value}</dd>
    </div>
  );
}
