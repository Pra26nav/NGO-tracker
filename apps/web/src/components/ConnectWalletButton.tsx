"use client";

import React, { useState } from "react";
import { useWeb3 } from "@/context/web3-provider";
import { Wallet, ChevronDown, Check, Copy, ExternalLink, Power, Sparkles, Shield, Circle } from "lucide-react";

export function ConnectWalletButton({ className = "" }: { className?: string }) {
  const {
    isConnected,
    isConnecting,
    address,
    formattedAddress,
    balanceFormatted,
    chainName,
    isDemoSigner,
    connectWallet,
    disconnectWallet,
    toggleDemoSigner,
  } = useWeb3();

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => connectWallet()}
          disabled={isConnecting}
          id="connect-wallet-btn"
          className="relative group px-3.5 py-1.5 rounded-xl font-bold text-xs text-white transition-all duration-300 flex items-center gap-2 overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.65)] border border-indigo-400/50 hover:border-indigo-300 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600"
        >
          {/* Animated glow shimmer */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          
          <Wallet className="w-3.5 h-3.5 text-indigo-100 animate-pulse" />
          <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        id="wallet-user-badge"
        className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all duration-200 border ${
          isDemoSigner
            ? "bg-slate-900/90 text-amber-300 border-amber-500/40 hover:border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            : "bg-slate-900/90 text-indigo-200 border-indigo-500/40 hover:border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isDemoSigner ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
          <span className="font-semibold text-slate-100">{balanceFormatted}</span>
        </span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-300 font-bold">{formattedAddress}</span>
        {isDemoSigner && (
          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-sans font-bold border border-amber-500/30">
            DEMO
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {/* Wallet Details Dropdown */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl z-50 space-y-3 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold text-white">Active Web3 Session</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                Base Sepolia
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-[10px] uppercase font-mono text-slate-400">Connected Address</div>
              <div className="text-xs font-mono font-bold text-slate-200 break-all select-all">
                {address}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">Balance:</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{balanceFormatted}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Addr"}</span>
              </button>

              <a
                href={`https://sepolia.basescan.org/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Basescan</span>
              </a>
            </div>

            {/* Demo Signer Switcher */}
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  toggleDemoSigner();
                  setMenuOpen(false);
                }}
                className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 transition"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{isDemoSigner ? "Switch to Live Extension" : "Switch to Demo Signer"}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">?demo=safe</span>
              </button>

              <button
                onClick={() => {
                  disconnectWallet();
                  setMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold transition"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
