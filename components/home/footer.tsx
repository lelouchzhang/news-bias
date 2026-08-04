import { AtSign, Rss, Send, X } from "lucide-react";

const companyLinks = ["About", "Careers", "Press", "Contact"] as const;
const helpLinks = [
  "Help Center",
  "Guides",
  "Privacy Policy",
  "Terms of Service",
] as const;

const socialLinks = [
  { label: "X / Twitter", Icon: X },
  { label: "LinkedIn", Icon: AtSign },
  { label: "Instagram", Icon: Send },
  { label: "YouTube", Icon: Rss },
] as const;

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: readonly string[];
}) {
  return (
    <div>
      <h3 className="text-caption font-semibold uppercase tracking-widest text-bg-primary/60">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link}>
            <button
              type="button"
              className="text-body-sm text-bg-primary/80 transition-colors hover:text-bg-primary"
            >
              {link}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-14 bg-text-primary">
      <div className="mx-auto w-full max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xl font-bold tracking-tight text-bg-primary">
              biasly{" "}
              <span className="text-body-md font-medium text-bg-primary/60">
                News
              </span>
            </p>
            <p className="mt-2 max-w-xs text-body-sm text-bg-primary/70">
              Balanced news coverage powered by AI.
            </p>
          </div>

          <LinkColumn title="Company" links={companyLinks} />
          <LinkColumn title="Help" links={helpLinks} />

          <div>
            <h3 className="text-caption font-semibold uppercase tracking-widest text-bg-primary/60">
              Connect
            </h3>
            <div className="mt-3 flex gap-3">
              {socialLinks.map(({ label, Icon }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-bg-primary/25 text-bg-primary/80 transition-colors hover:border-bg-primary hover:text-bg-primary"
                >
                  <Icon aria-hidden className="size-4" strokeWidth={2} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-bg-primary/15 pt-6">
          <p className="text-caption text-bg-primary/60">
            © 2026 Biasly News. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
