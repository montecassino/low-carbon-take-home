import type { GWPBreakdown } from "@/lib/types";

type Module = keyof GWPBreakdown;

const MODULES: Array<{ key: Module; label: string; group: string }> = [
  { key: "A1", label: "A1", group: "Manufacturing" },
  { key: "A2", label: "A2", group: "Manufacturing" },
  { key: "A3", label: "A3", group: "Manufacturing" },
  { key: "A1A3", label: "A1–A3", group: "Manufacturing (agg)" },
  { key: "A4", label: "A4", group: "Transport" },
  { key: "A5", label: "A5", group: "Installation" },
  { key: "C1", label: "C1", group: "End of life" },
  { key: "C2", label: "C2", group: "End of life" },
  { key: "C3", label: "C3", group: "End of life" },
  { key: "C4", label: "C4", group: "End of life" },
  { key: "D", label: "D", group: "Beyond system" },
];

// Only show aggregate A1-A3 bar if individual stages are not separately reported
function filterModules(breakdown: GWPBreakdown): Array<{ key: Module; label: string; group: string }> {
  const hasIndividual =
    breakdown.A1.status === "declared" ||
    breakdown.A2.status === "declared" ||
    breakdown.A3.status === "declared";
  return MODULES.filter((m) => {
    if (hasIndividual && m.key === "A1A3") return false;
    if (!hasIndividual && (m.key === "A1" || m.key === "A2" || m.key === "A3")) return false;
    // Skip B-stages (not relevant for concrete)
    return true;
  });
}

type Props = {
  breakdown: GWPBreakdown;
  title: string;
};

export function LifeCycleChart({ breakdown, title }: Props) {
  const modules = filterModules(breakdown);

  // Find the max absolute value for scaling (excluding ND/NR)
  const declared = modules
    .map((m) => breakdown[m.key])
    .filter((mv) => mv.status === "declared" && mv.value !== null)
    .map((mv) => Math.abs(mv.value!));
  const maxVal = declared.length > 0 ? Math.max(...declared) : 1;

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <div className="space-y-1.5">
        {modules.map(({ key, label, group }) => {
          const mv = breakdown[key];
          const isDeclared = mv.status === "declared" && mv.value !== null;
          const value = isDeclared ? mv.value! : null;
          const barWidth = isDeclared ? Math.abs(value!) / maxVal : 0;
          const isNegative = value !== null && value < 0;

          return (
            <div key={key} className="flex items-center gap-2">
              <div className="w-10 text-right font-mono text-xs text-gray-500">{label}</div>
              <div className="flex-1 relative h-5">
                {isDeclared ? (
                  <div
                    className={`absolute h-full rounded-sm transition-all ${
                      isNegative ? "bg-green-300 right-1/2" : "bg-carbon-400 left-0"
                    }`}
                    style={{
                      width: `${Math.max(barWidth * 50, 1)}%`,
                    }}
                    title={`${label}: ${value} kg CO₂e`}
                  />
                ) : (
                  <div className="flex h-full items-center">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        mv.status === "not_declared"
                          ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                          : mv.status === "not_separately_reported"
                          ? "bg-blue-50 text-blue-500 ring-1 ring-blue-200"
                          : "bg-gray-50 text-gray-400 ring-1 ring-gray-200"
                      }`}
                    >
                      {mv.status === "not_declared"
                        ? "Not reported"
                        : mv.status === "not_separately_reported"
                        ? "Included in A1–A3"
                        : "N/A"}
                    </span>
                  </div>
                )}
              </div>
              <div className="w-24 text-right text-xs text-gray-700">
                {value !== null ? (
                  <span className={isNegative ? "text-green-700 font-medium" : ""}>
                    {value.toFixed(2)}{" "}
                    <span className="text-gray-400">kg CO₂e</span>
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </div>
              <div className="w-28 text-xs text-gray-400 hidden sm:block">{group}</div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 pt-1">
        Negative values (module D) are recycling credits — benefits outside the system boundary.
        Green bars extend left. Bars scaled to the largest declared value.
      </p>
    </div>
  );
}
