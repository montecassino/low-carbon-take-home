import { getAllSummaryRows, getLocationOptions } from "@/lib/data";
import { CompareTable } from "@/components/CompareTable";

export default function HomePage() {
  const rows = getAllSummaryRows();
  const locationOptions = getLocationOptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Compare concrete by embodied carbon
        </h1>
        <p className="mt-2 text-gray-600 max-w-2xl">
          Each row is a concrete product with a published Environmental Product Declaration (EPD) —
          a standardised report of the carbon emitted to make and deliver it. Lower{" "}
          <strong>A1–A3</strong> means less carbon in the manufacturing process.
          Filter by strength or location to compare similar products.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500 text-sm">
            No extracted EPD data found. Run{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
              npm run extract
            </code>{" "}
            to process the PDFs in the <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">/EPD</code> folder.
          </p>
        </div>
      ) : (
        <CompareTable rows={rows} locationOptions={locationOptions} />
      )}
    </div>
  );
}
