import type { Metadata } from "next";
import "./globals.css";
import "./mobile-fix.css";
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
            /* Hide only the legacy desktop/mobile bottom navigation. Do NOT hide the new mobile menu panel. */
            body aside:not(.mobile-main-menu-panel) {
              display: none !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }

            .app > .sidebar,
            .shell > .sidebar,
            body .sidebar {
              display: none !important;
              visibility: hidden !important;
              pointer-events: none !important;
              height: 0 !important;
              min-height: 0 !important;
              max-height: 0 !important;
              overflow: hidden !important;
            }

            .shell {
              display:block !important;
              grid-template-columns:none !important;
              width:100% !important;
              max-width:100% !important;
              padding-bottom:16px !important;
            }

            .feed {
              padding-bottom:24px !important;
            }

            .mobile-main-menu { display:block !important; }
            .mobile-main-menu-trigger {
              display:flex !important;
              position:fixed !important;
              left:12px !important;
              top:calc(10px + env(safe-area-inset-top)) !important;
              width:42px !important;
              height:42px !important;
              align-items:center !important;
              justify-content:center !important;
              z-index:2147483003 !important;
              border:1px solid #292e3b !important;
              border-radius:13px !important;
              background:rgba(10,12,18,.94) !important;
              color:#fff !important;
              font-size:22px !important;
              line-height:1 !important;
              box-shadow:0 10px 30px rgba(0,0,0,.3) !important;
              touch-action:manipulation !important;
            }
            .mobile-main-menu-backdrop {
              display:block !important;
              position:fixed !important;
              inset:0 !important;
              z-index:2147483001 !important;
              border:0 !important;
              background:rgba(0,0,0,.58) !important;
              backdrop-filter:blur(5px) !important;
            }
            .mobile-main-menu-panel {
              display:block !important;
              position:fixed !important;
              left:0 !important;
              top:0 !important;
              bottom:0 !important;
              width:min(86vw,360px) !important;
              z-index:2147483002 !important;
              padding:calc(18px + env(safe-area-inset-top)) 16px calc(88px + env(safe-area-inset-bottom)) !important;
              overflow-y:auto !important;
              background:linear-gradient(180deg,#0b0d13,#07080c) !important;
              border-right:1px solid #242936 !important;
              box-shadow:20px 0 60px rgba(0,0,0,.45) !important;
            }
            .mobile-main-menu-head {
              display:flex !important;
              align-items:center !important;
              justify-content:space-between !important;
              padding:8px 4px 22px !important;
            }
            .mobile-main-menu-head span { color:#707788 !important; font-size:10px !important; letter-spacing:3px !important; font-weight:800 !important; }
            .mobile-main-menu-head h2 { margin:4px 0 0 !important; color:#fff !important; font-size:28px !important; }
            .mobile-main-menu-head button { width:40px !important; height:40px !important; border:1px solid #2b3040 !important; border-radius:50% !important; background:#11141c !important; color:#fff !important; font-size:26px !important; }
            .mobile-main-menu-list { display:flex !important; flex-direction:column !important; gap:5px !important; }
            .mobile-main-menu-list a { display:flex !important; align-items:center !important; gap:14px !important; min-height:52px !important; padding:9px 12px !important; border-radius:14px !important; color:#9ca3b3 !important; text-decoration:none !important; border:1px solid transparent !important; }
            .mobile-main-menu-list a > span { width:28px !important; text-align:center !important; font-size:22px !important; color:#d5d9e3 !important; }
            .mobile-main-menu-list a b { color:inherit !important; font-size:15px !important; }
            .mobile-main-menu-list a small { margin-left:auto !important; color:#747c8d !important; font-size:10px !important; }
            .mobile-main-menu-list a.is-active { color:#fff !important; background:linear-gradient(110deg,rgba(255,39,108,.15),rgba(87,94,255,.18)) !important; border-color:#30364a !important; }
          }
          @media (min-width: 761px) {
            .mobile-main-menu { display:none !important; }
          }
        `}</style>
      </body>
    </html>
  );
}
