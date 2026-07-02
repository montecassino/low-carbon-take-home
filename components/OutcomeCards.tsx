import type { Outcome } from "@/lib/outcomes";

type Props = {
  outcomes: Outcome[];
  title?: string;
};

const kindStyles = {
  good: "border-green-200 bg-green-50",
  caution: "border-amber-200 bg-amber-50",
  info: "border-blue-200 bg-blue-50",
  neutral: "border-gray-200 bg-gray-50",
};

const kindTitleStyles = {
  good: "text-green-800",
  caution: "text-amber-800",
  info: "text-blue-800",
  neutral: "text-gray-700",
};

const kindBodyStyles = {
  good: "text-green-700",
  caution: "text-amber-700",
  info: "text-blue-700",
  neutral: "text-gray-600",
};

export function OutcomeCards({ outcomes, title }: Props) {
  return (
    <div className="space-y-3">
      {title && (
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {outcomes.map((outcome, i) => (
          <div
            key={i}
            className={`rounded-lg border p-4 ${kindStyles[outcome.kind]}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0 mt-0.5">{outcome.icon}</span>
              <div>
                <p className={`text-sm font-semibold ${kindTitleStyles[outcome.kind]}`}>
                  {outcome.title}
                </p>
                <p className={`text-xs mt-1 leading-relaxed ${kindBodyStyles[outcome.kind]}`}>
                  {outcome.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
