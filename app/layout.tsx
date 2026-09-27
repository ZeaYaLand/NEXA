import type { Metadata } from "next";
import "./globals.css";
import PresenceSync from "./presence-sync";

export const metadata: Metadata = {
  title: "NEXA",
  description: "NEXA — a modern social network.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}<PresenceSync /></body>
    </html>
  );
}
