import { Menu } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", active: true, badge: false },
  { label: "For You", active: false, badge: true },
  { label: "Local", active: false, badge: false },
  { label: "Blindspot", active: false, badge: false },
] as const;

export function Header() {
  return (
    <header className="border-b border-border bg-bg-primary">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-6">
        <button
          type="button"
          aria-label="Open menu"
          className="-ml-2 rounded-md p-2 text-text-primary transition-colors hover:bg-surface"
        >
          <Menu aria-hidden className="size-5" strokeWidth={2} />
        </button>

        <p className="text-xl font-bold tracking-tight text-text-primary">
          biasly{" "}
          <span className="text-base font-normal text-text-secondary">
            News
          </span>
        </p>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={cn(
                "relative py-1 text-body-md font-medium transition-colors",
                item.active
                  ? "text-text-primary"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {item.label}
              {item.active ? (
                <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-text-primary" />
              ) : null}
              {item.badge ? (
                <span
                  aria-hidden
                  className="absolute -right-2 -top-1 size-1.5 rounded-full bg-red-500"
                />
              ) : null}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Button className="hidden sm:inline-flex">Subscribe</Button>
          <Show when="signed-out">
            <SignInButton mode="redirect">
              <Button variant="secondary">Login</Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
