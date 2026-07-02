"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EPDSummaryRow } from "@/lib/types";
import { FilterBar, type Filters } from "@/components/FilterBar";
import { ScopeIcons } from "@/components/ScopeIcons";

type Props = {
  rows: EPDSummaryRow[];
  locationOptions: string[];
};

type SortKey = "headlineGwp" | "strengthMpa";
type SortDir = "asc" | "desc";

export function CompareTable({ rows, locationOptions }: Props) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({
    search: "",
    strengthMpa: "",
    location: "",
  });

  const strengthOptions = [
    ...new Set(
      rows.map((r) => r.strengthMpa).filter((mpa): mpa is number => mpa !== null)
    ),
  ].sort((a, b) => a - b);
  const [sortKey, setSortKey] = useState<SortKey>("headlineGwp");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<string[]>([]);

  function toggleSelect(slug: string) {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 2) return [prev[1], slug]; // slide window: drop oldest, add new
      return [...prev, slug];
    });
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = rows.filter((row) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !row.productName.toLowerCase().includes(q) &&
        !row.manufacturer.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filters.strengthMpa) {
      if (row.strengthMpa !== parseFloat(filters.strengthMpa)) return false;
    }
    if (filters.location) {
      const rowLoc = [row.city, row.state].filter(Boolean).join(", ");
      if (!rowLoc.toLowerCase().includes(filters.location.toLowerCase())) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "headlineGwp") {
      const av = a.headlineGwp ?? Infinity;
      const bv = b.headlineGwp ?? Infinity;
      cmp = av - bv;
    } else if (sortKey === "strengthMpa") {
      const av = a.strengthMpa ?? 0;
      const bv = b.strengthMpa ?? 0;
      cmp = av - bv;
    }

    return sortDir === "asc" ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="ml-1 text-gray-300">↕</span>;
    return (
      <span className="ml-1 text-carbon-600">{sortDir === "asc" ? "↑" : "↓"}</span>
    );
  }

  const selectedRows = rows.filter((r) => selected.includes(r.slug));

  return (
    <div className="space-y-4">
      <FilterBar
        locationOptions={locationOptions}
        strengthOptions={strengthOptions}
        onChange={setFilters}
      />

      <p className="text-sm text-gray-500">
        {sorted.length === rows.length
          ? `${rows.length} products`
          : `${sorted.length} of ${rows.length} products`}
        {" "}&mdash; sorted by{" "}
        <button
          className="underline text-carbon-600"
          onClick={() => handleSort("headlineGwp")}
        >
          embodied carbon (A1–A3)
        </button>
      </p>

      <p className="text-xs text-gray-400 -mt-1">
        Tick any two products to compare them side by side.
      </p>

      {/* Scope warning */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Important:</strong> Products cover different life-cycle scopes — some include transport (A4), installation (A5) and end-of-life (C+D), others report only manufacturing (A1–A3). Compare like-with-like: the <strong>A1–A3</strong> column is the most directly comparable figure across all 20 products.
        A cell showing <span className="rounded bg-amber-100 px-1 font-mono text-xs">ND</span> or <strong>Not reported</strong> means data was not declared in that EPD — it is <em>not</em> zero.
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-3 py-3 w-8" title="Select up to 2 products to compare">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Manufacturer</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">
                <button onClick={() => handleSort("strengthMpa")} className="hover:text-gray-900">
                  Strength <SortIcon col="strengthMpa" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button onClick={() => handleSort("headlineGwp")} className="hover:text-gray-900 text-right block">
                  Embodied carbon<br />
                  <span className="font-normal normal-case text-gray-400">kg CO₂e/m³ (A1–A3)</span>
                  <SortIcon col="headlineGwp" />
                </button>
              </th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3 sr-only">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No products match the current filters.
                </td>
              </tr>
            )}
            {sorted.map((row) => (
              <tr
                key={row.slug}
                className={`hover:bg-gray-50 transition-colors ${selected.includes(row.slug) ? "bg-carbon-50 ring-1 ring-inset ring-carbon-200" : ""}`}
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(row.slug)}
                    onChange={() => toggleSelect(row.slug)}
                    className="h-4 w-4 rounded border-gray-300 text-carbon-600 focus:ring-carbon-400 cursor-pointer"
                    aria-label={`Select ${row.productName} for comparison`}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-52">
                  <Link href={`/product/${row.slug}`} className="hover:text-carbon-700 hover:underline">
                    {row.productName}
                  </Link>
                  {row.isLowCarbonMix && (
                    <span className="ml-1.5 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                      Low-carbon
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{row.manufacturer}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {[row.city, row.state].filter(Boolean).join(", ")}
                </td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {row.strengthMpa !== null ? (
                    <span>
                      <span className="font-medium">{row.strengthMpa}</span>{" "}
                      <span className="text-gray-400">MPa</span>
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.headlineGwp !== null ? (
                    <span className="font-semibold text-gray-900">
                      {row.headlineGwp.toFixed(0)}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200"
                      title="Not declared in this EPD"
                    >
                      Not reported
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ScopeIcons
                    coversEOL={row.scopeCoversEOL}
                    coversTransport={row.scopeCoversTransport}
                    coversInstallation={row.scopeCoversInstallation}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/product/${row.slug}`}
                    className="text-carbon-600 hover:underline text-xs whitespace-nowrap"
                  >
                    Stage detail →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        All figures sourced from third-party verified EPDs. Each number links to its source document.
      </p>

      {/* Floating compare bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-xl bg-gray-900 px-5 py-3 shadow-2xl text-white text-sm">
          <div className="flex items-center gap-2">
            {selectedRows.map((r) => (
              <span key={r.slug} className="flex items-center gap-1.5 rounded-md bg-gray-700 px-2.5 py-1 text-xs">
                <span className="max-w-32 truncate">{r.productName}</span>
                <button
                  onClick={() => toggleSelect(r.slug)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Remove"
                >
                  ×
                </button>
              </span>
            ))}
            {selected.length === 1 && (
              <span className="text-gray-400 text-xs">pick one more to compare</span>
            )}
          </div>
          {selected.length === 2 && (
            <button
              onClick={() => router.push(`/compare?a=${selected[0]}&b=${selected[1]}`)}
              className="rounded-lg bg-carbon-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-carbon-400 transition-colors"
            >
              Compare side by side →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
