import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  biasLabelDisplay,
  biasLabelTextClass,
  type BiasAnalysis,
} from "@/lib/article/mock-article-details";

interface BiasAnalysisCardProps {
  analysis: BiasAnalysis;
}

const barRows = [
  { label: "Left", barClass: "bg-left-bias" },
  { label: "Center", barClass: "bg-center-bias" },
  { label: "Right", barClass: "bg-right-bias" },
] as const;

export function BiasAnalysisCard({ analysis }: BiasAnalysisCardProps) {
  const { left, center, right } = analysis.distribution;
  const overallPercent = Math.max(left, center, right);

  return (
    <section className="rounded-lg border border-border bg-bg-primary p-5">
      <div className="flex items-center gap-1.5">
        <h2 className="text-body-md font-semibold text-text-primary">
          Bias Analysis
        </h2>
        <Info
          aria-hidden
          className="size-4 text-text-secondary"
          strokeWidth={2}
        />
      </div>

      <p className="mt-4 text-caption font-medium uppercase tracking-wide text-text-secondary">
        Overall Bias
      </p>
      <p
        className={cn(
          "mt-1 text-3xl font-bold",
          biasLabelTextClass[analysis.overallLabel],
        )}
      >
        {biasLabelDisplay[analysis.overallLabel]} {overallPercent}%
      </p>
      <p className="mt-1 text-body-sm text-right-bias">
        {analysis.basedOn}
      </p>

      <div className="mt-4">
        <div
          className="flex h-2.5 w-full overflow-hidden rounded-full"
          role="img"
          aria-label={`Bias meter: Left ${left}%, Center ${center}%, Right ${right}%`}
        >
          {barRows.map((row, index) => (
            <div
              key={row.label}
              className={row.barClass}
              style={{
                width: `${[left, center, right][index]}%`,
              }}
            />
          ))}
        </div>
        <div className="mt-2 flex w-full items-center justify-between text-caption text-text-secondary">
          {barRows.map((row, index) => (
            <span key={row.label}>
              {row.label} {[left, center, right][index]}%
            </span>
          ))}
        </div>
      </div>

      <p className="mt-4 text-body-sm text-text-secondary">
        {analysis.note}
      </p>

      <Button variant="secondary" className="mt-4 w-full">
        How We Analyze Bias
      </Button>
    </section>
  );
}
