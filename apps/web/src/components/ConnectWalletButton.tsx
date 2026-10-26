"use client";

import React, { useState } from "react";
import { useWeb3 } from "@/context/web3-provider";
import { Wallet, ChevronDown, Check, Copy, ExternalLink, Power, Sparkles, Shield } from "lucide-react";

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
          className="btn-brutal bg-charcoal text-white font-heading font-black text-xs px-4 py-2 rounded-lg flex items-center gap-2 tracking-tight uppercase hover:bg-black"
        >
          <Wallet className="w-4 h-4 text-primary" />
          <span>{isConnecting ? "Connecting..." : "CONNECT WALLET"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        id="wallet-user-badge"
        className="btn-brutal bg-white text-black font-mono font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-2"
      >
        <span className={`w-2.5 h-2.5 rounded-full border border-black ${isDemoSigner ? "bg-primary" : "bg-brutal-green"}`} />
        <span>{balanceFormatted}</span>
        <span className="text-black/40">|</span>
        <span className="font-heading font-extrabold">{formattedAddress}</span>
        {isDemoSigner && (
          <span className="bg-primary text-black text-[9px] font-mono px-1 py-0.2 rounded border border-black font-bold">
            DEMO
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-black" />
      </button>

      {/* Wallet Details Brutalist Dropdown */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-black rounded-xl p-4 shadow-brutal-lg z-50 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-black">
              <div className="flex items-center gap-1.5 text-xs text-black">
                <Shield className="w-4 h-4 text-charcoal" />
                <span className="font-heading font-black text-sm">Active Web3 Session</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sage text-black border border-black">
                Base Sepolia
              </span>
            </div>

            <div className="bg-primary/25 p-3 rounded-lg border-2 border-black space-y-1">
              <div className="text-[10px] uppercase font-mono font-bold text-black/70">Connected Address</div>
              <div className="text-xs font-mono font-bold text-black break-all select-all">
                {address}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-medium text-black/70">Vault Balance:</span>
                <span className="text-xs font-mono font-extrabold text-black">{balanceFormatted}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={handleCopy}
                className="btn-brutal bg-white hover:bg-sage text-black font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-brutal-green" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy Addr"}</span>
              </button>

              <a
                href={`https://sepolia.basescan.org/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="btn-brutal bg-white hover:bg-sage text-black font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Basescan</span>
              </a>
            </div>

            {/* Demo Signer Switcher */}
            <div className="pt-2 border-t-2 border-black flex flex-col gap-2">
              <button
                onClick={() => {
                  toggleDemoSigner();
                  setMenuOpen(false);
                }}
                className="btn-brutal bg-sage hover:bg-primary text-black text-xs font-bold flex items-center justify-between p-2 rounded-lg"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isDemoSigner ? "Switch to Live Extension" : "Switch to Demo Signer"}</span>
                </span>
                <span className="font-mono text-[10px] bg-white px-1 border border-black rounded">?demo=safe</span>
              </button>

              <button
                onClick={() => {
                  disconnectWallet();
                  setMenuOpen(false);
                }}
                className="btn-brutal bg-brutal-red text-white text-xs font-heading font-black flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-red-600"
              >
                <Power className="w-3.5 h-3.5" />
                <span>DISCONNECT</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
