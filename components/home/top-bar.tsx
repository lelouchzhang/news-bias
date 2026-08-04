import { ChevronDown, Globe, MapPin } from "lucide-react";

const themeOptions = ["Light", "Dark", "Auto"] as const;

export function TopBar() {
  return (
    <div className="bg-text-primary text-bg-primary">
      <div className="mx-auto flex h-9 w-full max-w-7xl items-center justify-between gap-4 px-6 text-caption">
        <span className="font-medium text-bg-primary/90">
          Browser Extension
        </span>
        <div className="hidden items-center gap-1 md:flex">
          <span className="text-bg-primary/70">Theme:</span>
          {themeOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`rounded px-1.5 py-0.5 font-medium transition-colors ${
                option === "Light"
                  ? "bg-bg-primary text-text-primary"
                  : "text-bg-primary/70 hover:text-bg-primary"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="hidden items-center gap-5 lg:flex">
          <span className="text-bg-primary/70">Monday, June 1, 2026</span>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-bg-primary/80 transition-colors hover:text-bg-primary"
          >
            <MapPin aria-hidden className="size-3.5" strokeWidth={2} />
            Set Location
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-bg-primary/80 transition-colors hover:text-bg-primary"
          >
            <Globe aria-hidden className="size-3.5" strokeWidth={2} />
            International Edition
            <ChevronDown aria-hidden className="size-3" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
