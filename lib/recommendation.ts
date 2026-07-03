  import type { EPD } from "@/extraction/schema";

  export type Verdict = "a_wins" | "b_wins" | "tie" | "not_comparable";

  export type Recommendation = {
    verdict: Verdict;
    winner: "A" | "B" | null;
    headline: string;
    reasoning: string[];
    caveats: string[];
  };

  function pct(lower: number, higher: number): string {
    return Math.round(((higher - lower) / higher) * 100) + "%";
  }

  export function generateRecommendation(
    a: EPD,
    labelA: string,
    b: EPD,
    labelB: string
  ): Recommendation {
    const gwpA = a.summary.headline_gwp_total_a1_a3;
    const gwpB = b.summary.headline_gwp_total_a1_a3;
    const mpaA = a.product.compressive_strength_mpa;
    const mpaB = b.product.compressive_strength_mpa;

    const caveats: string[] = [];
    const reasoning: string[] = [];

    if (gwpA === null || gwpB === null) {
      const missing = gwpA === null && gwpB === null
        ? "Neither product"
        : gwpA === null
        ? labelA
        : labelB;
      return {
        verdict: "not_comparable",
        winner: null,
        headline: `${missing} hasn't reported manufacturing carbon (A1–A3) — we can't make a fair comparison.`,
        reasoning: [],
        caveats: ["A missing figure is not the same as zero — ask the supplier for the A1–A3 number."],
      };
    }

    if (
      mpaA !== null &&
      mpaB !== null &&
      Math.abs(mpaA - mpaB) >= 5
    ) {
      caveats.push(
        `Different strength grades (${mpaA} MPa vs ${mpaB} MPa). A weaker mix often shows lower carbon — only compare products you can actually use for the same job.`
      );
    }

    const diff = Math.abs(gwpA - gwpB);
    const threshold = Math.min(gwpA, gwpB) * 0.03;

    if (diff <= threshold) {
      reasoning.push(
        `${gwpA.toFixed(0)} vs ${gwpB.toFixed(0)} kg CO₂e/m³ — a difference of ${diff.toFixed(1)} kg, within normal measurement uncertainty.`
      );
      return {
        verdict: "tie",
        winner: null,
        headline: "These two products are essentially equal on carbon — pick on price, location, or delivery lead time.",
        reasoning,
        caveats,
      };
    }

    const winner: "A" | "B" = gwpA < gwpB ? "A" : "B";
    const winnerLabel = winner === "A" ? labelA : labelB;
    const loserLabel = winner === "A" ? labelB : labelA;
    const winnerGwp = winner === "A" ? gwpA : gwpB;
    const loserGwp = winner === "A" ? gwpB : gwpA;
    const saving = loserGwp - winnerGwp;

    reasoning.push(
      `${winnerLabel}: ${winnerGwp.toFixed(0)} kg CO₂e/m³ vs ${loserLabel}: ${loserGwp.toFixed(0)} kg — ${saving.toFixed(0)} kg less per m³ (${pct(winnerGwp, loserGwp)} lower).`
    );

    return {
      verdict: winner === "A" ? "a_wins" : "b_wins",
      winner,
      headline: `${winnerLabel} is the lower-carbon choice — ${pct(winnerGwp, loserGwp)} less CO₂ per cubic metre.`,
      reasoning,
      caveats,
    };
  }
