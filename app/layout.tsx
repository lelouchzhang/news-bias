import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { poppins } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "biasly News",
  description: "Balanced news coverage, powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          afterSignOutUrl="/"
          appearance={{
            variables: {
              colorPrimary: "#0d0d0f",
              colorPrimaryForeground: "#ffffff",
              colorBackground: "#ffffff",
              colorForeground: "#0d0d0f",
              colorInput: "#ffffff",
              colorInputForeground: "#0d0d0f",
              borderRadius: "8px",
              fontFamily:
                "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
