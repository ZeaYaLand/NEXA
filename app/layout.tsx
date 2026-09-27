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
      <body>
        {children}
        <PresenceSync />
        <style>{`
          @media (max-width: 760px) {
            .sidebar nav a { font-size: 0 !important; }
            .sidebar nav a::before { font-size: 20px !important; }
            .sidebar nav a::after { font-size: 10px !important; }
          }
        `}</style>
      </body>
    </html>
  );
}