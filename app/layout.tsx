import type { Metadata } from "next";
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
