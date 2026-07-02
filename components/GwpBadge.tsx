import type { ModuleValue } from "@/lib/types";

type Props = {
  mv: ModuleValue | undefined;
  compact?: boolean;
};

export function GwpBadge({ mv, compact }: Props) {
  if (!mv) return <span className="text-gray-300">—</span>;

  if (mv.status === "not_declared") {
    return (
      <span
        className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200"
        title="Not declared — this stage was excluded from the EPD. This is NOT zero."
      >
        {compact ? "ND" : "Not reported"}
      </span>
    );
  }

  if (mv.status === "not_relevant") {
    return (
      <span
        className="inline-flex items-center rounded bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-400 ring-1 ring-gray-200"
        title="Not relevant — this life-cycle stage does not apply to this product type."
      >
        {compact ? "NR" : "N/A"}
      </span>
    );
  }

  if (mv.status === "not_separately_reported") {
    return (
      <span
        className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600 ring-1 ring-blue-200"
        title="This stage is included in the A1–A3 aggregate but was not broken out separately."
      >
        {compact ? "→A1-A3" : "In A1–A3"}
      </span>
    );
  }

  if (mv.value === null) {
    return <span className="text-gray-300">—</span>;
  }

  const formatted =
    mv.value < 0
      ? mv.value.toFixed(2)
      : mv.value >= 1000
      ? mv.value.toFixed(0)
      : mv.value >= 100
      ? mv.value.toFixed(1)
      : mv.value.toFixed(2);

  return (
    <span className={mv.value < 0 ? "text-green-600 font-medium" : "text-gray-900"}>
      {formatted}
    </span>
  );
}
