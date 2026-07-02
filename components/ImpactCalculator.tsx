"use client";

import { useState } from "react";
import { PROJECT_PRESETS, getProjectCarbonImpact, EQUIVALENCIES } from "@/lib/outcomes";

type Props = {
  labelA: string;
  labelB: string;
  gwpA: number | null;
  gwpB: number | null;
};

export function ImpactCalculator({ labelA, labelB, gwpA, gwpB }: Props) {
  const [presetIdx, setPresetIdx] = useState(1); // default: house slab
  const [customM3, setCustomM3] = useState("");

  const preset = PROJECT_PRESETS[presetIdx];
  const isCustom = preset.label === "Custom";
  const volumeM3 = isCustom ? parseFloat(customM3) || 0 : preset.m3;

  const impactA = gwpA !== null && volumeM3 > 0 ? getProjectCarbonImpact(gwpA, volumeM3) : null;
  const impactB = gwpB !== null && volumeM3 > 0 ? getProjectCarbonImpact(gwpB, volumeM3) : null;

  const saving =
    impactA !== null && impactB !== null
      ? Math.abs(impactA.totalKg - impactB.totalKg)
      : null;
  const winnerLabel =
    impactA !== null && impactB !== null
      ? impactA.totalKg < impactB.totalKg
        ? labelA
        : impactB.totalKg < impactA.totalKg
        ? labelB
        : null
      : null;

  return (
    <div className="rounded-xl border-2 border-carbon-200 bg-white p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          What does this mean for your project?
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter how much concrete you need and we'll show you the real-world carbon impact of choosing each product.
        </p>
      </div>

      {/* Preset selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Project size</label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPresetIdx(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                presetIdx === i
                  ? "bg-carbon-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {isCustom && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min="1"
              placeholder="e.g. 50"
              value={customM3}
              onChange={(e) => setCustomM3(e.target.value)}
              className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-carbon-400"
            />
            <span className="text-sm text-gray-500">m³ of concrete</span>
          </div>
        )}
        {!isCustom && (
          <p className="text-xs text-gray-400">{preset.description} = {preset.m3} m³</p>
        )}
      </div>

      {/* Results grid */}
      {volumeM3 > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ImpactCard
              label={labelA}
              impact={impactA}
              gwpPerM3={gwpA}
              volumeM3={volumeM3}
              isWinner={winnerLabel === labelA}
            />
            <ImpactCard
              label={labelB}
              impact={impactB}
              gwpPerM3={gwpB}
              volumeM3={volumeM3}
              isWinner={winnerLabel === labelB}
            />
          </div>

          {saving !== null && saving > 0 && winnerLabel && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
              <strong>Choosing {winnerLabel}</strong> for this project saves{" "}
              <strong>{saving.toFixed(0)} kg CO₂</strong> compared to the alternative — like{" "}
              <strong>{Math.round(saving / EQUIVALENCIES.CAR_KG_PER_KM).toLocaleString()} km</strong>{" "}
              fewer in a petrol car, or{" "}
              <strong>{(saving / EQUIVALENCIES.FLIGHT_SYD_MEL_KG).toFixed(1)}</strong>{" "}
              Sydney–Melbourne return flight{(saving / EQUIVALENCIES.FLIGHT_SYD_MEL_KG) !== 1 ? "s" : ""}.
            </div>
          )}

          {saving !== null && saving === 0 && (
            <p className="text-sm text-gray-500 text-center">
              Both products produce the same total carbon for this project size.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ImpactCard({
  label,
  impact,
  gwpPerM3,
  volumeM3,
  isWinner,
}: {
  label: string;
  impact: ReturnType<typeof getProjectCarbonImpact> | null;
  gwpPerM3: number | null;
  volumeM3: number;
  isWinner: boolean;
}) {
  if (gwpPerM3 === null) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
        <p className="font-medium">{label}</p>
        <p className="mt-1">A1–A3 carbon not reported — can't calculate</p>
      </div>
    );
  }

  if (!impact) return null;

  return (
    <div
      className={`rounded-lg border p-4 ${
        isWinner
          ? "border-green-300 bg-green-50"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700 truncate pr-2">{label}</p>
        {isWinner && (
          <span className="text-xs font-medium text-green-600 shrink-0">Lower carbon ✓</span>
        )}
      </div>

      <p className="text-2xl font-bold text-gray-900 tabular-nums">
        {impact.totalKg >= 1000
          ? `${(impact.totalKg / 1000).toFixed(2)} t`
          : `${impact.totalKg.toFixed(0)} kg`}
        <span className="text-sm font-normal text-gray-400 ml-1">CO₂e</span>
      </p>
      <p className="text-xs text-gray-400 mb-3">
        for {volumeM3} m³ ({gwpPerM3.toFixed(0)} kg CO₂e/m³)
      </p>

      <ul className="space-y-1.5 text-xs text-gray-600">
        <li className="flex items-start gap-1.5">
          <span>🚗</span>
          <span>Like driving <strong>{impact.carKm.toLocaleString()} km</strong> in a petrol car</span>
        </li>
        <li className="flex items-start gap-1.5">
          <span>✈️</span>
          <span>
            <strong>{impact.flights}</strong> Sydney–Melbourne return flight{impact.flights !== 1 ? "s" : ""}
          </span>
        </li>
      </ul>
    </div>
  );
}
