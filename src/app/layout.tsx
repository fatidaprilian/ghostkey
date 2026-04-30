import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GhostKey BreachEngine Suite",
  description: "Local-first cryptanalysis dashboard for educational breach analysis."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
