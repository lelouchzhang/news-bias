import { ArrowRight } from "lucide-react";
import { Chip } from "@/components/ui/chip";

const categories = [
  "World Cup",
  "IPL",
  "Social Media",
  "Business & Markets",
  "Health & Medicine",
  "Soccer",
  "Artificial Intelligence",
  "Arsenal FC",
  "Extreme Weather and Disasters",
] as const;

export function CategoryBar() {
  return (
    <div className="border-b border-border bg-bg-primary">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 py-3">
        <div className="scrollbar-none flex flex-1 items-center gap-3 overflow-x-auto">
          {categories.map((category) => (
            <Chip key={category} className="shrink-0">
              {category}
            </Chip>
          ))}
        </div>
        <button
          type="button"
          aria-label="More categories"
          className="hidden shrink-0 rounded-full border border-border bg-bg-primary p-1.5 text-text-secondary transition-colors hover:text-text-primary sm:inline-flex"
        >
          <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
