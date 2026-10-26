"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowRight,
  ExternalLink,
  Layers,
  Activity,
  Copy,
  Check,
  CheckCircle2,
  Terminal,
  Cpu,
  Eye,
  FileSearch,
} from "lucide-react";

interface StoryStage {
  id: number;
  numberTag: string;
  title: string;
  label: string;
  shortDesc: string;
  timeRange: [number, number];
  escrowStatus: "ACTIVE" | "VERIFYING" | "ALERT" | "FROZEN";
  activeAlert?: string;
  dctPhash: string;
}

const STORY_STAGES: StoryStage[] = [
  {
    id: 1,
    numberTag: "STAGE 1 OF 5: DEPOSIT & EARMARK",
    title: "STAGE 1: DONATION LOCKED",
    label: "M1: DEPOSIT",
    shortDesc: "50.0 ETH locked into PurposeBoundEscrow.sol earmarked for 'Water Infrastructure'",
    timeRange: [0, 4],
    escrowStatus: "ACTIVE",
    dctPhash: "0000000000000000",
  },
  {
    id: 2,
    numberTag: "STAGE 2 OF 5: TRANCHE 1 RELEASE",
    title: "STAGE 2: VALID TRANCHE RELEASE",
    label: "M2: OCR",
    shortDesc: "Vidarbha Geological submits INV-1001 for borewell survey. 10.0 ETH released safely.",
    timeRange: [4, 8],
    escrowStatus: "ACTIVE",
    dctPhash: "1A2B3C4D5E6F7A8B",
  },
  {
    id: 3,
    numberTag: "STAGE 3 OF 5: AI FORENSICS SCAN",
    title: "STAGE 3: RECEIPT UPLOAD & ELA",
    label: "M3: MERKLE",
    shortDesc: "NGO uploads Phase 2 claim. 64-bit DCT perceptual hashing and ELA compression scan.",
    timeRange: [8, 12],
    escrowStatus: "VERIFYING",
    dctPhash: "A4F09B22C1D88310",
  },
  {
    id: 4,
    numberTag: "STAGE 4 OF 5: INJECTED CROP ATTACK",
    title: "STAGE 4: ADVERSARIAL INJECTION",
    label: "M4: CROP-ATTACK",
    shortDesc: "Adversary crops receipt by 2px to mutate SHA-256 and attempts cross-pool double spend.",
    timeRange: [12, 16],
    escrowStatus: "ALERT",
    activeAlert: "ADVERSARIAL 2PX CROP DOUBLE-SPEND INJECTED",
    dctPhash: "F4C19A82BB04C810",
  },
  {
    id: 5,
    numberTag: "STAGE 5 OF 5: AUTONOMOUS FREEZE",
    title: "STAGE 5: THE CLIMAX — VAULT FREEZE",
    label: "M5: FREEZE",
    shortDesc: "Nullifier collision detected in Donor_Pool_A! EscrowAutoFrozen() emitted on Base Sepolia.",
    timeRange: [16, 20],
    escrowStatus: "FROZEN",
    activeAlert: "ESCROW AUTONOMOUSLY FROZEN: 40 ETH PROTECTED",
    dctPhash: "F4C19A82BB04C810",
  },
];

interface LogEntry {
  timeSec: number;
  timeLabel: string;
  text: string;
  type: "info" | "warn" | "critical" | "success";
}

const TERMINAL_LOGS: LogEntry[] = [
  { timeSec: 1.0, timeLabel: "[+01.00s]", text: "PurposeBoundEscrow: 50.00 ETH ($160,000) locked to 'Water Infrastructure'", type: "info" },
  { timeSec: 4.5, timeLabel: "[+04.50s]", text: "Tranche 1 Payout: 10.00 ETH disbursed to Vidarbha Geological. Clean ELA 1.2%", type: "success" },
  { timeSec: 9.0, timeLabel: "[+09.00s]", text: "Receipt Upload: INV-2026-8841 submitted. Parsing OCR fields...", type: "info" },
  { timeSec: 12.1, timeLabel: "[+12.10s]", text: "OCR Pipeline: Processed invoice #INV-8891 ($24,500.00)", type: "info" },
  { timeSec: 14.05, timeLabel: "[+14.05s]", text: "ATTACK VECTOR: Secondary claim submitted with 2px corner crop", type: "warn" },
  { timeSec: 15.2, timeLabel: "[+15.20s]", text: "COLLISION: Nullifier 0x6e21... already claimed in Donor_Pool_A!", type: "critical" },
  { timeSec: 16.5, timeLabel: "[+16.50s]", text: "EscrowAutoFrozen(campaignId=1, nullifier=0x6e21...) EMITTED ON BASE SEPOLIA", type: "critical" },
  { timeSec: 18.0, timeLabel: "[+18.00s]", text: "SMART CONTRACT GUARD: VAULT LOCKED. 40.00 ETH permanently shielded.", type: "success" },
];

export default function HomePage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(14.5);
  const [copied, setCopied] = useState(false);

  const TOTAL_DURATION = 20.0;

  // Find active stage
  const activeStage = useMemo(() => {
    return (
      STORY_STAGES.find(
        (s) => currentTime >= s.timeRange[0] && currentTime <= s.timeRange[1]
      ) || STORY_STAGES[STORY_STAGES.length - 1]
    );
  }, [currentTime]);

  // Run 20s animation loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= TOTAL_DURATION) {
          return 0;
        }
        return Math.min(TOTAL_DURATION, +(prev + 0.1).toFixed(2));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleCopyContract = () => {
    navigator.clipboard.writeText("0x71C3a89...4489B");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const visibleLogs = TERMINAL_LOGS.filter((l) => l.timeSec <= currentTime);

  return (
    <div className="w-full bg-dot-pattern min-h-screen text-black">
      {/* ── Main Hero Section ────────────────────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Headline, Narrative & Pillars (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Top Hackathon Tag Badge */}
            <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-3.5 py-1.5 rounded-lg shadow-brutal-sm w-fit">
              <span className="w-2.5 h-2.5 rounded-full bg-primary border border-black" />
              <span className="font-heading font-black text-xs uppercase tracking-tight">
                CASCADE 26 — THEME 4, PROBLEM STATEMENT 2
              </span>
            </div>

            {/* Massive Hero Headline */}
            <div className="flex flex-col">
              <h1 className="font-heading font-black text-5xl sm:text-6xl md:text-7xl leading-[0.92] tracking-tighter text-black uppercase">
                VERIFY THE{" "}
                <span className="inline-block bg-white border-2 border-black px-3 py-0.5 rounded-lg shadow-brutal ml-1 align-baseline">
                  BLACK HOLE
                </span>
                <br />
                INTO TRUST.
              </h1>
            </div>

            {/* Subtitle */}
            <p className="font-body text-base sm:text-lg text-black/85 max-w-2xl leading-relaxed">
              Stop trusting unverified PDF receipts. The Black Hole Ledger binds 50 ETH to smart contract earmarks,
              catches 2px-cropped double spend receipts via DCT perceptual hashing, and auto-freezes escrows on-chain.
            </p>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/red-team"
                className="btn-brutal bg-charcoal hover:bg-black text-white font-heading font-black text-sm uppercase px-6 py-3.5 rounded-lg flex items-center gap-3 tracking-tight shadow-brutal"
              >
                <span>LAUNCH RED-TEAM LAB</span>
                <ArrowRight className="w-4 h-4 text-primary" />
              </Link>

              <button
                onClick={() => {
                  setCurrentTime(0);
                  setIsPlaying(true);
                }}
                className="btn-brutal bg-white hover:bg-sage text-black font-heading font-black text-sm uppercase px-6 py-3.5 rounded-lg flex items-center gap-3 tracking-tight shadow-brutal"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>WATCH 20S ATTACK THEATER</span>
              </button>
            </div>

            {/* Trust Checks Ribbon */}
            <div className="bg-white border-2 border-black rounded-lg p-2.5 shadow-brutal-sm flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-bold">
              <div className="flex items-center gap-1.5 text-black">
                <span className="text-brutal-green">✓</span>
                <span>100% ON-CHAIN ESCROW</span>
              </div>
              <div className="flex items-center gap-1.5 text-black">
                <span className="text-brutal-green">✓</span>
                <span>0 BYTES BENEFICIARY PII LEAKED</span>
              </div>
              <div className="flex items-center gap-1.5 text-black">
                <span className="text-brutal-green">✓</span>
                <span>ZERO HUMAN DELAY</span>
              </div>
            </div>

            {/* Three Info Box Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border-2 border-black rounded-lg p-3 shadow-brutal-sm">
                <div className="text-[10px] font-mono font-bold text-black/60 uppercase">EARMARK KECCAK</div>
                <div className="text-xs font-mono font-extrabold text-black truncate pt-0.5">0x9d4e...a28c</div>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-3 shadow-brutal-sm">
                <div className="text-[10px] font-mono font-bold text-black/60 uppercase">DCT HASH MATCH</div>
                <div className="text-xs font-mono font-extrabold text-brutal-red uppercase pt-0.5">COLLISION DETECTED</div>
              </div>

              <div className="bg-white border-2 border-black rounded-lg p-3 shadow-brutal-sm">
                <div className="text-[10px] font-mono font-bold text-black/60 uppercase">ZK-SALTED MERKLE</div>
                <div className="text-xs font-mono font-extrabold text-black pt-0.5">142 Root Leaves</div>
              </div>
            </div>

          </div>

          {/* Right Column: ATTACK THEATER MONITOR Window Mockup (5 cols) */}
          <div className="lg:col-span-5">
            <div className="window-brutal shadow-brutal-lg">
              
              {/* Window Header Bar (macOS Traffic Light Dots + Title) */}
              <div className="window-header justify-between">
                <div className="flex items-center gap-2">
                  <span className="window-dot bg-[#ff5f56]" />
                  <span className="window-dot bg-[#ffbd2e]" />
                  <span className="window-dot bg-[#27c93f]" />
                  <span className="text-white text-xs font-mono font-bold ml-2 tracking-tight">
                    ATTACK-THEATER-MONITOR // V2.4-ACTIVE
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-primary bg-charcoal px-2 py-0.5 rounded border border-white/20">
                  LIVE FEED
                </span>
              </div>

              {/* Window Interior Content */}
              <div className="p-4 sm:p-5 flex flex-col gap-4 bg-white">
                
                {/* Total Capital Locked Card */}
                <div className="border-2 border-black rounded-lg p-3.5 bg-white flex items-center justify-between flex-wrap gap-2 shadow-brutal-sm">
                  <div>
                    <div className="text-[10px] font-mono font-bold text-black/60 uppercase tracking-wider">
                      TOTAL CAPITAL LOCKED
                    </div>
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="font-heading font-black text-2xl text-black">50.00 ETH</span>
                      <span className="text-xs font-mono text-black/60">($160,000.00)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-sage text-black font-mono font-bold text-xs px-2.5 py-1 rounded border border-black">
                      +20% Verified
                    </span>
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border border-black flex items-center gap-1.5 ${
                      activeStage.escrowStatus === "FROZEN"
                        ? "bg-brutal-red text-white"
                        : "bg-sage text-black"
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-black" />
                      <span>ESCROW: {activeStage.escrowStatus}</span>
                    </span>
                  </div>
                </div>

                {/* Stage Info Card & Progress Scrubber */}
                <div className="border-2 border-black rounded-lg p-3.5 bg-primary/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="bg-charcoal text-white px-2 py-1 rounded border border-black">
                      {activeStage.numberTag}
                    </span>
                    <span className="text-black">
                      T +{currentTime.toFixed(2)}s / 20.00s
                    </span>
                  </div>

                  {/* Active Alert Banner */}
                  {activeStage.activeAlert && (
                    <div className="border-2 border-black rounded bg-white p-2 flex items-center gap-2 text-xs font-heading font-extrabold text-black">
                      <ShieldAlert className="w-4 h-4 text-brutal-red shrink-0" />
                      <span className="uppercase tracking-tight">{activeStage.activeAlert}</span>
                    </div>
                  )}

                  {/* Scrubber Pipeline Progress */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-black/70 uppercase">
                      <span>M1: DEPOSIT</span>
                      <span>M2: OCR</span>
                      <span>M3: MERKLE</span>
                      <span className="text-brutal-red font-black">M4: CROP-ATTACK</span>
                      <span>M5: FREEZE</span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-3.5 bg-white border-2 border-black rounded-full overflow-hidden flex shadow-brutal-sm">
                      <div
                        className="h-full bg-charcoal transition-all duration-100"
                        style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Playback Controls & DCT pHash Pill */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="btn-brutal bg-white hover:bg-sage text-black font-mono font-bold text-xs px-3 py-1 rounded flex items-center gap-1.5"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isPlaying ? "PAUSE" : "PLAY"}</span>
                      </button>

                      <button
                        onClick={() => setCurrentTime(0)}
                        className="btn-brutal bg-white hover:bg-sage text-black font-mono font-bold text-xs px-2.5 py-1 rounded flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>RESTART</span>
                      </button>
                    </div>

                    <div className="text-[10px] font-mono font-bold bg-white px-2 py-1 rounded border border-black">
                      DCT PHASH: <span className="text-black font-black">{activeStage.dctPhash}</span>
                    </div>
                  </div>
                </div>

                {/* Live Event Bus Subscriber Terminal */}
                <div className="border-2 border-black rounded-lg bg-charcoal text-white p-3 flex flex-col gap-2 font-mono text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/20 text-[10px]">
                    <span className="text-white/60">EVENT_BUS_SUBSCRIBER // BASE_SEPOLIA</span>
                    <span className="text-primary font-bold">RPC SYNCED</span>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto no-scrollbar font-mono text-[11px] leading-tight">
                    {visibleLogs.slice(-4).map((log, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-primary/70 shrink-0">{log.timeLabel}</span>
                        <span
                          className={
                            log.type === "critical"
                              ? "text-brutal-red font-bold"
                              : log.type === "warn"
                              ? "text-primary font-bold"
                              : log.type === "success"
                              ? "text-brutal-green font-bold"
                              : "text-white/80"
                          }
                        >
                          {log.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] text-white/50">
                    <span className="flex items-center gap-1 text-white">
                      <ShieldCheck className="w-3 h-3 text-brutal-green" />
                      <span>SMART CONTRACT GUARD: ACTIVE</span>
                    </span>
                    <span className="font-mono">GAS: 142,309 GWEI</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Three Pillars Section (Yellow, Sage, White Cards) ── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pillar 01: Purpose-Bound Escrow (Yellow Card) */}
          <div className="card-brutal-yellow p-6 rounded-xl flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="bg-charcoal text-white text-[10px] font-mono font-bold px-2 py-1 rounded border border-black uppercase tracking-wider">
                  PILLAR 01 // CAPITAL CONTROL
                </span>
                <Lock className="w-5 h-5 text-black" />
              </div>

              <h2 className="font-heading font-black text-2xl text-black uppercase tracking-tight">
                PURPOSE-BOUND ESCROW
              </h2>

              <p className="font-body text-xs sm:text-sm text-black/85 leading-relaxed">
                Capital is never sent in bulk to opaque intermediary accounts. 50 ETH remains locked in strict EVM state
                until Keccak-256 purpose earmarks are cryptographically satisfied.
              </p>
            </div>

            <div className="border-t-2 border-black pt-4 flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-black/70">Earmark Lock:</span>
                <span className="bg-primary px-2 py-0.5 rounded border border-black font-bold">50.00 ETH ($160K)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black/70">Disbursement Rule:</span>
                <span className="font-bold">Automated Milestone Quorum</span>
              </div>
            </div>
          </div>

          {/* Pillar 02: DCT Perceptual Hashing & ELA (Sage Card) */}
          <div className="card-brutal-sage p-6 rounded-xl flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="bg-charcoal text-white text-[10px] font-mono font-bold px-2 py-1 rounded border border-black uppercase tracking-wider">
                  PILLAR 02 // FORENSIC VISION
                </span>
                <Eye className="w-5 h-5 text-black" />
              </div>

              <h2 className="font-heading font-black text-2xl text-black uppercase tracking-tight">
                DCT PERCEPTUAL HASHING &amp; ELA
              </h2>

              <p className="font-body text-xs sm:text-sm text-black/85 leading-relaxed">
                Catches 2px-cropped duplicate invoices, altered receipt numbers, and Photoshop error-level doctoring before
                release. Colliding perceptual hashes immediately lock the vault.
              </p>
            </div>

            <div className="border-t-2 border-black pt-4 flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-black/70">Detection Latency:</span>
                <span className="bg-white px-2 py-0.5 rounded border border-black font-bold">&lt; 420 ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black/70">Duplicate Evasion:</span>
                <span className="font-bold text-brutal-red uppercase">MATHEMATICALLY IMPOSSIBLE</span>
              </div>
            </div>
          </div>

          {/* Pillar 03: Zero-PII Beneficiary Shield (White Card) */}
          <div className="card-brutal p-6 rounded-xl flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="bg-charcoal text-white text-[10px] font-mono font-bold px-2 py-1 rounded border border-black uppercase tracking-wider">
                  PILLAR 03 // HUMAN INTEGRITY
                </span>
                <ShieldCheck className="w-5 h-5 text-black" />
              </div>

              <h2 className="font-heading font-black text-2xl text-black uppercase tracking-tight">
                ZERO-PII BENEFICIARY SHIELD
              </h2>

              <p className="font-body text-xs sm:text-sm text-black/85 leading-relaxed">
                142 rural households committed via salted Merkle trees. Donors verify exact receipt attribution without
                exposing names, bank accounts, or sensitive home addresses to the public chain.
              </p>
            </div>

            <div className="border-t-2 border-black pt-4 flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-black/70">PII Leaked To Chain:</span>
                <span className="bg-sage text-black px-2 py-0.5 rounded border border-black font-bold">0 BYTES</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black/70">Proof Method:</span>
                <span className="font-bold">Poseidon Hash Salted Leaves</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 04 The 20-Second On-Chain Circuit ─────────────── */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 pb-16">
        <div className="card-brutal p-6 sm:p-8 rounded-2xl flex flex-col gap-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b-2 border-black">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 bg-charcoal text-white font-heading font-black text-base flex items-center justify-center rounded border-2 border-black shadow-brutal-sm">
                04
              </span>
              <div>
                <h3 className="font-heading font-black text-xl sm:text-2xl text-black uppercase tracking-tight">
                  THE 20-SECOND ON-CHAIN CIRCUIT
                </h3>
                <p className="font-mono text-xs text-black/60 uppercase">
                  HOW THE BLACK HOLE LEDGER DESTROYS FRAUD AT THE PROTOCOL LAYER
                </p>
              </div>
            </div>

            <div className="bg-primary border-2 border-black px-3 py-1 rounded text-xs font-mono font-bold">
              ZERO HUMAN DISCRETION
            </div>
          </div>

          {/* 4 Phase Horizontal Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="border-2 border-black rounded-xl p-4 bg-white flex flex-col gap-2 shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-black/60">
                <span>PHASE 1</span>
                <span className="w-2.5 h-2.5 rounded-full bg-brutal-green border border-black" />
              </div>
              <div className="font-heading font-black text-base text-black uppercase">
                MULTI-RAIL INFLOW
              </div>
              <p className="font-body text-xs text-black/80">
                Donors deposit ETH or fiat. Contracts issue Keccak earmark hash constraints instantly.
              </p>
            </div>

            <div className="border-2 border-black rounded-xl p-4 bg-white flex flex-col gap-2 shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-black/60">
                <span>PHASE 2</span>
                <span className="w-2.5 h-2.5 rounded-full bg-brutal-green border border-black" />
              </div>
              <div className="font-heading font-black text-base text-black uppercase">
                INVOICE OCR + PHASH
              </div>
              <p className="font-body text-xs text-black/80">
                Uploaded bills are converted to 64-bit DCT perceptual matrices and cross-referenced globally.
              </p>
            </div>

            <div className="border-2 border-black rounded-xl p-4 bg-white flex flex-col gap-2 shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-black/60">
                <span>PHASE 3</span>
                <span className="w-2.5 h-2.5 rounded-full bg-brutal-red border border-black" />
              </div>
              <div className="font-heading font-black text-base text-black uppercase">
                ADVERSARIAL CLASH
              </div>
              <p className="font-body text-xs text-black/80">
                Cropping receipts by 2px alters the cryptographic MD5 hash, but DCT perceptual distance remains &lt;3.
              </p>
            </div>

            <div className="border-2 border-black rounded-xl p-4 bg-white flex flex-col gap-2 shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-black/60">
                <span>PHASE 4</span>
                <span className="w-2.5 h-2.5 rounded-full bg-charcoal border border-black" />
              </div>
              <div className="font-heading font-black text-base text-black uppercase">
                AUTONOMOUS SLASHING
              </div>
              <p className="font-body text-xs text-black/80">
                Contract emits <span className="font-mono bg-primary px-1 border border-black rounded text-[11px] font-bold">EscrowFrozen()</span>.
                Remaining ETH is returned to donors without human review.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── Bottom Operational Footer ─────────────────────── */}
      <footer className="w-full bg-white border-t-2 border-black py-4 px-4 sm:px-6">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-mono font-bold text-black">
          
          <div className="flex items-center gap-3 flex-wrap">
            <span>CONTRACT:</span>
            <button
              onClick={handleCopyContract}
              className="bg-primary border-2 border-black px-2.5 py-1 rounded shadow-brutal-sm flex items-center gap-1.5 hover:bg-primary/80 transition"
            >
              <span>0x71C3a89...4489B</span>
              {copied ? <Check className="w-3.5 h-3.5 text-brutal-green" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <div className="bg-white border-2 border-black px-2.5 py-1 rounded shadow-brutal-sm flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brutal-green" />
              <span>ZERO PII SHIELD ACTIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-black/70">
            <span className="flex items-center gap-1.5 text-black">
              <span className="w-2 h-2 rounded-full bg-brutal-green border border-black" />
              <span>SYSTEM 100% OPERATIONAL</span>
            </span>
            <span>© 2026 THE BLACK HOLE LEDGER</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
