import {
  Bell,
  Bookmark,
  Calendar,
  ChartColumn,
  Check,
  Clock,
  ExternalLink,
  Info,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  Share,
  Tag,
  User,
} from "lucide-react";
import { BiasMeter } from "@/components/ui/bias-meter";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

const typeScale = [
  {
    token: "H1",
    usage: "Page / Screen Title",
    size: "32px",
    weight: "Bold",
    lineHeight: "1.2",
    previewClass: "text-h1",
  },
  {
    token: "H2",
    usage: "Section Title",
    size: "24px",
    weight: "SemiBold",
    lineHeight: "1.3",
    previewClass: "text-h2",
  },
  {
    token: "H3",
    usage: "Card / Module Title",
    size: "20px",
    weight: "SemiBold",
    lineHeight: "1.3",
    previewClass: "text-h3",
  },
  {
    token: "H4",
    usage: "Subheading",
    size: "16px",
    weight: "Medium",
    lineHeight: "1.4",
    previewClass: "text-h4",
  },
  {
    token: "Body Large",
    usage: "Important content",
    size: "16px",
    weight: "Regular",
    lineHeight: "1.6",
    previewClass: "text-body-lg",
  },
  {
    token: "Body Medium",
    usage: "Body text",
    size: "14px",
    weight: "Regular",
    lineHeight: "1.6",
    previewClass: "text-body-md",
  },
  {
    token: "Body Small",
    usage: "Supporting text",
    size: "13px",
    weight: "Regular",
    lineHeight: "1.6",
    previewClass: "text-body-sm",
  },
  {
    token: "Caption",
    usage: "Labels, meta text",
    size: "11px",
    weight: "Regular",
    lineHeight: "1.4",
    previewClass: "text-caption",
  },
] as const;

const colorGroups = [
  {
    name: "Primary",
    swatches: [
      {
        name: "TEXT PRIMARY",
        hex: "#0D0D0F",
        swatchClass: "bg-text-primary",
        textClass: "text-bg-primary",
      },
      {
        name: "TEXT SECONDARY",
        hex: "#6B7280",
        swatchClass: "bg-text-secondary",
        textClass: "text-bg-primary",
      },
      {
        name: "SURFACE",
        hex: "#F6F6F6",
        swatchClass: "bg-surface",
        textClass: "text-text-primary",
      },
    ],
  },
  {
    name: "Semantic",
    swatches: [
      {
        name: "LEFT BIAS",
        hex: "#B42318",
        swatchClass: "bg-left-bias",
        textClass: "text-bg-primary",
      },
      {
        name: "CENTER",
        hex: "#E5E7EB",
        swatchClass: "bg-center-bias",
        textClass: "text-text-primary",
      },
      {
        name: "RIGHT BIAS",
        hex: "#1D4ED8",
        swatchClass: "bg-right-bias",
        textClass: "text-bg-primary",
      },
    ],
  },
  {
    name: "Neutrals",
    swatches: [
      {
        name: "BG PRIMARY",
        hex: "#FFFFFF",
        swatchClass: "border border-border bg-bg-primary",
        textClass: "text-text-primary",
      },
      {
        name: "BG SECONDARY",
        hex: "#F0F0F0",
        swatchClass: "bg-bg-secondary",
        textClass: "text-text-primary",
      },
      {
        name: "BORDER",
        hex: "#E5E7EB",
        swatchClass: "bg-border",
        textClass: "text-text-primary",
      },
      {
        name: "DIVIDER",
        hex: "#E5E7EB",
        swatchClass: "bg-divider",
        textClass: "text-text-primary",
      },
    ],
  },
] as const;

const icons = [
  { name: "Menu", Icon: Menu },
  { name: "Search", Icon: Search },
  { name: "Bookmark", Icon: Bookmark },
  { name: "Clock", Icon: Clock },
  { name: "Info", Icon: Info },
  { name: "Share", Icon: Share },
  { name: "External Link", Icon: ExternalLink },
  { name: "Calendar", Icon: Calendar },
  { name: "Chart", Icon: ChartColumn },
  { name: "Tag", Icon: Tag },
  { name: "User", Icon: User },
  { name: "Bell", Icon: Bell },
  { name: "Settings", Icon: Settings },
  { name: "Check", Icon: Check },
  { name: "More", Icon: MoreHorizontal },
] as const;

const spacingSteps = [4, 8, 16, 24, 32, 40, 64] as const;

const buttonStates = ["default", "hover", "outline", "disabled"] as const;
type ButtonState = (typeof buttonStates)[number];

const buttonVariants = [
  "primary",
  "secondary",
  "text",
] as const satisfies readonly ButtonVariant[];

function DemoButton({
  variant,
  state,
}: {
  variant: ButtonVariant;
  state: ButtonState;
}) {
  if (variant === "text" && (state === "outline" || state === "disabled")) {
    return (
      <span
        aria-hidden
        className="inline-flex h-10 items-center px-4 text-body-md text-text-secondary"
      >
        —
      </span>
    );
  }

  const hoverClass =
    variant === "primary"
      ? "bg-text-primary/90"
      : variant === "secondary"
        ? "bg-surface"
        : "text-right-bias";

  return (
    <Button
      variant={variant}
      disabled={state === "disabled"}
      className={state === "hover" ? hoverClass : undefined}
    >
      Button
    </Button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-caption font-medium uppercase tracking-widest text-text-secondary">
        {title}
      </h2>
      <Card>{children}</Card>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-6 py-10 md:py-14">
        <p className="text-caption uppercase tracking-widest text-text-secondary">
          Biasly News · Design System v1.0
        </p>

        <Section title="Brand">
          <div>
            <p className="text-6xl font-bold tracking-tight text-text-primary">
              biasly
            </p>
            <p className="mt-1 text-body-lg text-text-secondary">News</p>
            <p className="mt-4 text-body-md text-text-secondary">
              Balanced news coverage, powered by AI.
            </p>
          </div>
        </Section>

        <Section title="Typography">
          <div className="flex flex-col gap-10">
            <div>
              <p className="text-4xl font-semibold text-text-primary">
                Poppins
              </p>
              <p className="mt-2 max-w-xl text-body-md text-text-secondary">
                Poppins is a modern geometric sans-serif typeface that ensures
                clarity and excellent readability.
              </p>
              <p className="mt-1 text-caption text-text-secondary">
                Font Family · Geometric Sans-Serif · Weights 400 / 500 / 600 /
                700
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-170 border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-caption uppercase tracking-wide text-text-secondary">
                    <th className="py-2 pr-4 font-medium">Token</th>
                    <th className="py-2 pr-4 font-medium">Usage</th>
                    <th className="py-2 pr-4 font-medium">Size</th>
                    <th className="py-2 pr-4 font-medium">Weight</th>
                    <th className="py-2 pr-4 font-medium">Line Height</th>
                    <th className="py-2 font-medium">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {typeScale.map((row) => (
                    <tr key={row.token} className="border-b border-border">
                      <td className="py-3 pr-4 text-caption text-text-secondary">
                        {row.token}
                      </td>
                      <td className="py-3 pr-4 text-body-sm text-text-secondary">
                        {row.usage}
                      </td>
                      <td className="py-3 pr-4 text-body-sm">{row.size}</td>
                      <td className="py-3 pr-4 text-body-sm">{row.weight}</td>
                      <td className="py-3 pr-4 text-body-sm">
                        {row.lineHeight}
                      </td>
                      <td className={cn("py-3", row.previewClass)}>Ag</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section title="UI Elements">
          <div className="flex flex-col gap-8">
            <div>
              <p className="mb-3 text-caption uppercase tracking-wide text-text-secondary">
                Buttons
              </p>
              <div className="flex flex-col gap-6">
                {buttonVariants.map((variant) => (
                  <div key={variant}>
                    <p className="mb-2 text-caption font-medium uppercase text-text-secondary">
                      {variant}
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                      {buttonStates.map((state) => (
                        <div
                          key={state}
                          className="flex flex-col items-start gap-2"
                        >
                          <span className="text-caption uppercase text-text-secondary">
                            {state}
                          </span>
                          <DemoButton variant={variant} state={state} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-caption uppercase tracking-wide text-text-secondary">
                Chip / Category
              </p>
              <div className="flex flex-wrap gap-3">
                <Chip>World Cup</Chip>
                <Chip>IPL</Chip>
                <Chip>{"Business & Markets"}</Chip>
                <Chip>More</Chip>
              </div>
            </div>

            <div>
              <p className="mb-3 text-caption uppercase tracking-wide text-text-secondary">
                Bias Meter
              </p>
              <div className="max-w-md">
                <BiasMeter left={25} center={50} right={25} />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Colors">
          <div className="flex flex-col gap-8">
            {colorGroups.map((group) => (
              <div key={group.name}>
                <h3 className="mb-3 text-caption uppercase tracking-widest text-text-secondary">
                  {group.name}
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {group.swatches.map((swatch) => (
                    <div
                      key={swatch.name}
                      className="overflow-hidden rounded-md border border-border bg-bg-primary"
                    >
                      <div className={cn("h-20", swatch.swatchClass)} />
                      <div className="px-3 py-2">
                        <p className="text-caption font-medium text-text-primary">
                          {swatch.name}
                        </p>
                        <p className="text-caption text-text-secondary">
                          {swatch.hex}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Icons">
          <div className="flex flex-col gap-6">
            <p className="text-caption text-text-secondary">
              Line style · 2px stroke · Rounded caps
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-6">
              {icons.map(({ name, Icon }) => (
                <div
                  key={name}
                  className="flex w-24 flex-col items-center gap-2"
                >
                  <Icon
                    aria-hidden
                    className="size-6 text-text-primary"
                    strokeWidth={2}
                  />
                  <span className="text-caption text-text-secondary">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Spacing System">
          <div className="flex flex-col gap-6">
            <p className="text-caption text-text-secondary">
              Consistent spacing scale based on 4px base unit
            </p>
            <div className="flex flex-wrap items-end gap-6">
              {spacingSteps.map((step) => (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div
                    className="rounded-sm bg-right-bias/25"
                    style={{ width: step, height: step }}
                  />
                  <span className="text-caption text-text-secondary">
                    {step}px
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Grid System">
          <div className="flex flex-col gap-6">
            <div className="rounded-lg bg-bg-secondary p-6">
              <div className="grid grid-cols-12 gap-6">
                {Array.from({ length: 12 }, (_, index) => (
                  <div
                    key={index}
                    className="h-10 rounded-sm bg-right-bias/20"
                  />
                ))}
              </div>
            </div>
            <p className="text-caption text-text-secondary">
              Container 1280px · 12 Columns · Gutter 24px · Margin 24px
            </p>
          </div>
        </Section>

        <Section title="Shadows">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                name: "Small",
                value: "0 1px 2px rgba(0,0,0,0.05)",
                shadowClass: "shadow-sm",
              },
              {
                name: "Medium",
                value: "0 4px 12px rgba(0,0,0,0.08)",
                shadowClass: "shadow-md",
              },
              {
                name: "Large",
                value: "0 12px 24px rgba(0,0,0,0.12)",
                shadowClass: "shadow-lg",
              },
            ].map((shadow) => (
              <div key={shadow.name}>
                <div
                  className={cn(
                    "h-24 rounded-lg bg-bg-primary",
                    shadow.shadowClass,
                  )}
                />
                <p className="mt-2 text-caption font-medium text-text-primary">
                  {shadow.name}
                </p>
                <p className="text-caption text-text-secondary">
                  {shadow.value}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Border Radius">
          <div className="flex flex-wrap gap-8">
            {[
              { name: "Small", value: "4px", radiusClass: "rounded-sm" },
              { name: "Medium", value: "8px", radiusClass: "rounded-md" },
              { name: "Large", value: "12px", radiusClass: "rounded-lg" },
              { name: "Full", value: "9999px", radiusClass: "rounded-full" },
            ].map((radius) => (
              <div
                key={radius.name}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={cn(
                    "h-16 w-16 border border-border bg-bg-secondary",
                    radius.radiusClass,
                  )}
                />
                <span className="text-caption font-medium text-text-primary">
                  {radius.name}
                </span>
                <span className="text-caption text-text-secondary">
                  {radius.value}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <footer className="mt-14 rounded-lg bg-text-primary px-8 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xl font-bold text-bg-primary">
                biasly{" "}
                <span className="font-medium text-text-secondary">News</span>
              </p>
              <p className="mt-1 text-body-sm text-text-secondary">
                Balanced news coverage, powered by AI.
              </p>
            </div>
            <div className="text-caption text-text-secondary">
              <p>Design System v1.0</p>
              <p>June 1, 2026</p>
            </div>
            <p className="text-body-sm text-text-secondary">
              Stay consistent. Stay unbiased.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
