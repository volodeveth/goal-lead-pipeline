import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ціль — Marketing Agency",
  description: "Запустимо вашу маркетингову кампанію за тиждень.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="bg-neutral-950 text-neutral-100 antialiased">{children}</body>
    </html>
  );
}
