import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXA",
  description: "NEXA — a modern social network.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
