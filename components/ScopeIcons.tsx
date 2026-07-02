type Props = {
  coversEOL: boolean;
  coversTransport: boolean;
  coversInstallation: boolean;
};

export function ScopeIcons({ coversEOL, coversTransport, coversInstallation }: Props) {
  return (
    <div className="flex gap-1 flex-wrap">
      <ScopePill active={true} label="A1–A3" title="Manufacturing (always included)" />
      <ScopePill active={coversTransport} label="A4" title="Transport to site" />
      <ScopePill active={coversInstallation} label="A5" title="Installation on site" />
      <ScopePill active={coversEOL} label="C+D" title="End of life + recycling credit" />
    </div>
  );
}

function ScopePill({
  active,
  label,
  title,
}: {
  active: boolean;
  label: string;
  title: string;
}) {
  return (
    <span
      title={title}
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-mono ring-1 ${
        active
          ? "bg-carbon-100 text-carbon-800 ring-carbon-300"
          : "bg-gray-50 text-gray-300 ring-gray-200"
      }`}
    >
      {label}
    </span>
  );
}
