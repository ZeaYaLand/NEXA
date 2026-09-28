import type { Metadata } from "next";
import "./globals.css";
import PresenceSync from "./presence-sync";
import MobileMoreMenu from "@/components/MobileMoreMenu";

export const metadata: Metadata = {
  title: "NEXA",
  description: "NEXA — a modern social network.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        {children}
        <PresenceSync />
        <MobileMoreMenu />
        <style>{`
          @media (max-width: 760px) {
            .sidebar nav a { font-size: 0 !important; }
            .sidebar nav a::before { font-size: 20px !important; }
            .sidebar nav a::after { font-size: 10px !important; }

            /* Mobile feature hub: never hide the sections that exist on desktop. */
            .mobile-more-root {
              display: block !important;
              position: fixed !important;
              inset: 0 !important;
              z-index: 2147483001 !important;
              pointer-events: none !important;
            }
            .mobile-more-trigger {
              display: flex !important;
              position: fixed !important;
              right: 12px !important;
              bottom: calc(76px + env(safe-area-inset-bottom)) !important;
              z-index: 2147483003 !important;
              pointer-events: auto !important;
              touch-action: manipulation !important;
              -webkit-tap-highlight-color: transparent !important;
            }
            .mobile-more-trigger.is-open {
              background: #171a24 !important;
            }
            .mobile-more-backdrop {
              display: block !important;
              position: fixed !important;
              inset: 0 !important;
              z-index: 2147483002 !important;
              pointer-events: auto !important;
            }
            .mobile-more-panel {
              display: block !important;
              position: fixed !important;
              left: 10px !important;
              right: 10px !important;
              bottom: calc(78px + env(safe-area-inset-bottom)) !important;
              z-index: 2147483004 !important;
              pointer-events: auto !important;
              max-height: min(72vh, 620px) !important;
              overflow-y: auto !important;
              overscroll-behavior: contain !important;
              -webkit-overflow-scrolling: touch !important;
            }
            .mobile-more-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            .mobile-more-item.is-active {
              border-color: #737cff !important;
              background: linear-gradient(135deg, rgba(255,39,112,.14), rgba(92,98,255,.16)) !important;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
