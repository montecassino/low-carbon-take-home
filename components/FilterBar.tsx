"use client";

import { useState } from "react";

export type Filters = {
  search: string;
  strengthMpa: string;
  location: string;
};

type Props = {
  locationOptions: string[];
  strengthOptions: number[];
  onChange: (filters: Filters) => void;
};

export function FilterBar({ locationOptions, strengthOptions, onChange }: Props) {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    strengthMpa: "",
    location: "",
  });

  function update(partial: Partial<Filters>) {
    const next = { ...filters, ...partial };
    setFilters(next);
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <input
        type="text"
        placeholder="Search product or manufacturer…"
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-carbon-400 sm:w-64"
      />

      <select
        value={filters.strengthMpa}
        onChange={(e) => update({ strengthMpa: e.target.value })}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-carbon-400"
      >
        <option value="">All strengths</option>
        {strengthOptions.map((mpa) => (
          <option key={mpa} value={String(mpa)}>
            {mpa} MPa
          </option>
        ))}
      </select>

      <select
        value={filters.location}
        onChange={(e) => update({ location: e.target.value })}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-carbon-400"
      >
        <option value="">All locations</option>
        {locationOptions.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </select>
    </div>
  );
}
