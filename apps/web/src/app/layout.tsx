import type { Metadata } from "next";
import "./globals.css";
import { GlobalNavbar } from "@/components/GlobalNavbar";
import { LedgerProvider } from "@/context/ledger-context";
import { Web3Provider } from "@/context/web3-provider";
import { LiveSyncBanner } from "@/components/LiveSyncBanner";

export const metadata: Metadata = {
  title: "The Black Hole Ledger v2.4 | Verifiable NGO Fund Flows — CASCADE '26",
  description:
    "CASCADE '26 Theme 4 PS 2 — Neo-Brutalist Adversarial Red-Team Stress-Test & Autonomous Escrow Auto-Freeze Engine. " +
    "Powered by Semantic Nullifiers, ELA Pixel Forensics, Perceptual Hashing, and ZK Merkle Privacy Shield.",
  keywords: ["NGO", "blockchain", "escrow", "forensics", "ELA", "nullifier", "merkle", "cascade26", "neo-brutalism"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800,900&f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-dot-pattern text-black selection:bg-charcoal selection:text-primary">
        <Web3Provider>
          <LedgerProvider>
            <GlobalNavbar />
            <LiveSyncBanner />
            <main className="flex-1 w-full">{children}</main>
          </LedgerProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
