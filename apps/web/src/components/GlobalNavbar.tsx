"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLedger } from "@/context/ledger-context";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export function GlobalNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const { vaultBalance, escrowStatus } = useLedger();

  useEffect(() => {
    let isMounted = true;
    const checkState = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/health", {
          signal: AbortSignal.timeout(2000),
        });
        if (isMounted) setApiOnline(res.ok);
      } catch {
        if (isMounted) setApiOnline(false);
      }
    };
    checkState();
    const interval = setInterval(checkState, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { href: "/", label: "OVERVIEW" },
    { href: "/red-team", label: "RED-TEAM LAB" },
    { href: "/flow-tracer", label: "FLOW TRACER" },
    { href: "/dashboard", label: "MILESTONE VAULT" },
    { href: "/donate", label: "DONATE MULTI-RAIL" },
    { href: "/reconciliation", label: "RECONCILIATION" },
    { href: "/pitch", label: "JUDGE PITCH" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-primary border-b-2 border-black">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 md:gap-4 flex-wrap lg:flex-nowrap">
          
          {/* Brand Logo & Title (Lumina / Brutalist Box) */}
          <div className="flex items-center gap-2">
            {/* Target / Aperture Glyph */}
            <div className="w-9 h-9 bg-primary border-2 border-black rounded-lg flex items-center justify-center shadow-brutal-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" stroke="#000000" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="3" fill="#000000" />
                <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <Link
              href="/"
              className="bg-white border-2 border-black px-3 py-1.5 rounded-lg shadow-brutal-sm flex items-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <span className="font-heading font-black text-sm sm:text-base tracking-tight text-black">
                BLACK HOLE LEDGER
              </span>
              <span className="bg-charcoal text-primary text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-black">
                v2.4
              </span>
            </Link>
          </div>

          {/* Navigation Links Bar */}
          <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 no-scrollbar">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-heading font-extrabold tracking-tight px-3 py-1.5 rounded-lg border-2 border-black transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-white text-black shadow-brutal"
                      : "bg-transparent text-charcoal hover:bg-white/80 hover:shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Status Pill & Connect Wallet */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Network & Escrow Status Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 rounded-lg shadow-brutal-sm text-xs font-mono font-bold">
              <span
                className={`w-2.5 h-2.5 rounded-full border border-black ${
                  escrowStatus === "FROZEN"
                    ? "bg-brutal-red animate-pulse"
                    : "bg-brutal-green"
                }`}
              />
              <span className="text-black">Base Sepolia</span>
              <span className="text-black/40">•</span>
              <span className="text-black font-semibold">
                {escrowStatus === "FROZEN" ? "FROZEN" : `${vaultBalance.toFixed(0)} ETH Active`}
              </span>
            </div>

            {/* Connect Wallet Tactile Button */}
            <ConnectWalletButton />
          </div>

        </div>
      </div>
    </header>
  );
}
