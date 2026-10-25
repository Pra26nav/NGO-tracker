"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import seedData from "@/data/campaign-seed.json";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Coins,
  FileSearch,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Zap,
  Flame,
  Eye,
  Layers,
  Terminal,
  Cpu,
  Sparkles,
  RefreshCw,
  FileText,
  Activity,
  Check,
  Copy,
  Sliders,
  ChevronRight,
  Globe,
  Radio,
  Clock,
  ArrowUpRight,
  AlertOctagon,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Attack Story Stage Definitions (20-Second Script)
──────────────────────────────────────────────────────────── */
interface StoryStage {
  id: number;
  title: string;
  badge: string;
  badgeColor: "emerald" | "indigo" | "amber" | "red";
  timeRange: [number, number]; // seconds [start, end]
  label: string;
  shortDesc: string;
  headline: string;
  details: string;
  keyMetric: { label: string; value: string };
  escrowStatus: "ACTIVE" | "VERIFYING" | "ALERT" | "FROZEN";
  vaultBalance: number;
  releasedAmount: number;
  activeTx: string;
}

const STORY_STAGES: StoryStage[] = [
  {
    id: 1,
    title: "Stage 1: Donate & Earmark Lock",
    badge: "00-03s • DONATION LOCKED",
    badgeColor: "emerald",
    timeRange: [0, 3],
    label: "🟢 Donate & Lock",
    shortDesc: "50.0 ETH locked into PurposeBoundEscrow.sol with strict Keccak-256 earmark",
    headline: "Philanthropic Capital Committed to On-Chain Earmark Locker",
    details:
      "Donor 0x71C9...b901 deposits 50.00 ETH ($160,000 USD / ₹1,34,64,000). PurposeBoundEscrow.sol locks funds strictly to Keccak-256 commitment of 'Water Infrastructure'. No funds can leave without cryptographic milestone proof.",
    keyMetric: { label: "Vault Locked", value: "50.00 ETH ($160,000)" },
    escrowStatus: "ACTIVE",
    vaultBalance: 50.0,
    releasedAmount: 0.0,
    activeTx: "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
  },
  {
    id: 2,
    title: "Stage 2: Valid Tranche 1 Release",
    badge: "03-07s • TRANCHE RELEASED",
    badgeColor: "emerald",
    timeRange: [3, 7],
    label: "✨ Valid Tranche Release",
    shortDesc: "Tranche 1 (10.0 ETH) released upon legitimate hydrogeology milestone verification",
    headline: "Phase 1 Mobilization Verified: 10.0 ETH Disbursed Safely to Vendor",
    details:
      "Vidarbha Geological submits legitimate invoice INV-2026-1001 for borewell mapping. AI forensics confirm 0 pHash collision and ELA pixel error = 1.2% (< 5%). Smart contract auto-releases 10.0 ETH; 40.0 ETH remains safe in vault.",
    keyMetric: { label: "Disbursed / Remaining", value: "10.0 ETH / 40.0 ETH Safe" },
    escrowStatus: "ACTIVE",
    vaultBalance: 40.0,
    releasedAmount: 10.0,
    activeTx: "0x9c00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
  },
  {
    id: 3,
    title: "Stage 3: Milestone Receipt Upload & AI Forensics",
    badge: "07-12s • AI AUDIT SCAN",
    badgeColor: "indigo",
    timeRange: [7, 12],
    label: "📸 Receipt Upload & AI Check",
    shortDesc: "NGO uploads receipt; engine runs 64-bit DCT pHash & Error Level Analysis (ELA)",
    headline: "Autonomous Verification Pipeline: Generating Cryptographic Invariants",
    details:
      "NGO uploads milestone receipt INV-2026-8841. The verifier parses OCR categories, computes deterministic Semantic Nullifier (keccak256(TaxID | InvNo | Date | Amount)), generates 64-bit DCT pHash, and analyzes 8x8 DCT compression grids.",
    keyMetric: { label: "Scanning Invariant", value: "pHash + Semantic Nullifier" },
    escrowStatus: "VERIFYING",
    vaultBalance: 40.0,
    releasedAmount: 10.0,
    activeTx: "0x3f9e8a002b11cd88a1e4599023ffaa12bb33445566778899aabbccddeeff0011",
  },
  {
    id: 4,
    title: "Stage 4: Adversarial Attack Injected",
    badge: "12-16s • EXPLOIT DETECTED",
    badgeColor: "amber",
    timeRange: [12, 16],
    label: "⚠️ Adversarial Attack",
    shortDesc: "Attacker crops receipt by 2px to mutate SHA-256 and attempts cross-donor double spend",
    headline: "Adversarial Vector: Image Mutation & Cross-Pool Double Spending",
    details:
      "Adversary crops border by 2px to alter raw SHA-256 (0x77d1... != 0x4b1e...), attempting to re-claim ₹45,000 from Donor Pool B. Naive deduplication would fail, but Semantic Nullifiers and pHash (Hamming Dist = 2 < 5 threshold) flag the collision!",
    keyMetric: { label: "Hamming Distance", value: "2 (< 5 Threshold: CLONE)" },
    escrowStatus: "ALERT",
    vaultBalance: 40.0,
    releasedAmount: 10.0,
    activeTx: "0xdead000199f2b4c8e1a33d77f9081c2b3a4d5e6f708192a3b4c5d6e7f8091a2b",
  },
  {
    id: 5,
    title: "Stage 5: THE CLIMAX - Autonomous Vault Freeze",
    badge: "16-20s • CIRCUIT BREAKER TRIPPED",
    badgeColor: "red",
    timeRange: [16, 20],
    label: "🔒 THE CLIMAX: Vault Freeze",
    shortDesc: "EscrowAutoFrozen emitted on-chain; 40.0 ETH permanently shielded from theft",
    headline: "CLIMAX: Autonomous Smart Contract Circuit Breaker Halts Escrow",
    details:
      "Nullifier collision confirmed against Donor_Pool_A! PurposeBoundEscrow.sol automatically triggers EscrowAutoFrozen with ZERO human intervention. 100% of remaining 40.0 ETH ($128,000 USD) is permanently protected.",
    keyMetric: { label: "Capital Protected", value: "40.00 ETH ($128,000 USD)" },
    escrowStatus: "FROZEN",
    vaultBalance: 40.0,
    releasedAmount: 10.0,
    activeTx: "0xdead000199f2b4c8e1a33d77f9081c2b3a4d5e6f708192a3b4c5d6e7f8091a2b",
  },
];

/* ────────────────────────────────────────────────────────────
   Terminal Log Stream per Second
──────────────────────────────────────────────────────────── */
interface TerminalLog {
  timeSec: number;
  source: string;
  level: "INFO" | "SUCCESS" | "WARN" | "CRITICAL";
  message: string;
}

const TERMINAL_LOGS: TerminalLog[] = [
  { timeSec: 0.5, source: "EVM_ESCROW", level: "INFO", message: "PurposeBoundEscrow.createCampaign(id=1, earmark=0x4f8a91b2c3d4...)" },
  { timeSec: 1.5, source: "GATEWAY", level: "SUCCESS", message: "DepositConfirmed: 50.00 ETH ($160,000 USD) locked into escrow contract" },
  { timeSec: 2.5, source: "ESCROW_LEDGER", level: "INFO", message: "State committed: 4 tranches initialized (10/15/15/10 ETH). Vault balance: 50.0 ETH" },
  { timeSec: 3.5, source: "ORACLE", level: "INFO", message: "Vidarbha Geological & Drilling Consultancy (GSTIN-27VWW001Z) submits INV-2026-1001" },
  { timeSec: 4.8, source: "FORENSICS", level: "SUCCESS", message: "ELA score: 1.2% (Pass <= 5%). pHash distance: 28 (No collision). Category: Water Infrastructure" },
  { timeSec: 6.0, source: "EVM_ESCROW", level: "SUCCESS", message: "ExpenditureVerified emitted! Tranche 1 (10.0 ETH) disbursed. Remaining balance: 40.0 ETH" },
  { timeSec: 7.5, source: "RECEIPT_INGEST", level: "INFO", message: "NGO uploads Phase 2 claim: INV-2026-8841 (Nagpur Hydro Pipes Pvt Ltd, ₹45,000)" },
  { timeSec: 9.0, source: "NULLIFIER_ENGINE", level: "INFO", message: "Computing Semantic Nullifier: keccak256(GSTIN-27AAACW1234F1Z5 | INV-2026-8841 | 2026-10-24 | 45000)" },
  { timeSec: 10.5, source: "VISION_AI", level: "INFO", message: "64-bit DCT perceptual hash generated: a4f09b22c1d88310. Scanning 8x8 DCT grid..." },
  { timeSec: 12.2, source: "SECURITY_RADAR", level: "WARN", message: "ADVERSARIAL INJECTION DETECTED: Image cropped by 2px to change raw SHA-256 hash" },
  { timeSec: 13.8, source: "FORENSICS", level: "WARN", message: "High ELA anomaly around Total Amount (38.7% > 15.0%). Font kerning mismatch detected!" },
  { timeSec: 15.2, source: "NULLIFIER_ENGINE", level: "CRITICAL", message: "COLLISION DETECTED: Semantic Nullifier 0x6e21... already claimed in Donor_Pool_A! Hamming Dist = 2" },
  { timeSec: 16.5, source: "CIRCUIT_BREAKER", level: "CRITICAL", message: "EscrowAutoFrozen(nullifier=0x6e21..., reason='Cross-Donor Double Spend Detected') ON-CHAIN" },
  { timeSec: 18.0, source: "SMART_CONTRACT", level: "CRITICAL", message: "ESCROW PERMANENTLY LOCKED. All further disbursements halted. 40.00 ETH saved from theft." },
  { timeSec: 19.5, source: "AUDIT_SUMMARY", level: "SUCCESS", message: "Zero human intervention required. Forensic evidence anchored to block #20491892" },
];

export default function HomePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // 0.0 to 20.0
  const [hasStarted, setHasStarted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const theaterRef = useRef<HTMLDivElement>(null);

  const TOTAL_DURATION = 20.0;

  // Active Story Stage based on current timestamp
  const activeStage = useMemo(() => {
    return (
      STORY_STAGES.find(
        (s) => currentTime >= s.timeRange[0] && currentTime <= s.timeRange[1]
      ) || STORY_STAGES[STORY_STAGES.length - 1]
    );
  }, [currentTime]);

  // Is in climax window
  const isClimax = currentTime >= 16.0;

  // 20-Second High-Precision Animation Loop
  useEffect(() => {
    let animId: number;
    let lastStamp: number | null = null;

    const tick = (stamp: number) => {
      if (lastStamp === null) lastStamp = stamp;
      const deltaSec = (stamp - lastStamp) / 1000;
      lastStamp = stamp;

      setCurrentTime((prev) => {
        const next = prev + deltaSec;
        if (next >= TOTAL_DURATION) {
          setIsPlaying(false);
          return TOTAL_DURATION;
        }
        return next;
      });

      if (isPlaying) {
        animId = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      animId = requestAnimationFrame(tick);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  const handleStartStory = () => {
    setHasStarted(true);
    setCurrentTime(0);
    setIsPlaying(true);
    if (theaterRef.current) {
      theaterRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleTogglePlay = () => {
    if (!hasStarted) setHasStarted(true);
    if (currentTime >= TOTAL_DURATION) {
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleJumpToStage = (stage: StoryStage) => {
    setHasStarted(true);
    setCurrentTime(stage.timeRange[0] + 0.1);
  };

  const handleCopyCommitment = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Filter logs up to current time
  const visibleLogs = useMemo(() => {
    return TERMINAL_LOGS.filter((l) => l.timeSec <= currentTime);
  }, [currentTime]);

  return (
    <div
      className={`min-h-screen text-slate-100 transition-colors duration-500 relative overflow-hidden ${
        isClimax
          ? "bg-slate-950/95 animate-red-strobe"
          : "bg-gradient-to-b from-slate-950 via-[#070b16] to-[#030611]"
      }`}
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Dynamic Ambient Aura */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
          isClimax
            ? "bg-red-600/35"
            : currentTime >= 12
            ? "bg-amber-600/25"
            : "bg-indigo-600/18"
        }`}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {/* ── Top Super-Badge ── */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)] backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-[11px] font-bold tracking-wider uppercase bg-gradient-to-r from-indigo-300 via-sky-300 to-indigo-100 bg-clip-text text-transparent font-mono">
              Autonomous Philanthropic Fraud Verifier • Hackathon Showcase
            </span>
          </div>
        </div>

        {/* ── Hero Title & Mission ── */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-4">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              THE BLACK HOLE
            </span>{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              LEDGER
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Zero-Trust milestone escrow combining{" "}
            <span className="text-indigo-300 font-semibold">Deterministic Semantic Nullifiers</span>,{" "}
            <span className="text-cyan-300 font-semibold">Dual-Tier Perceptual Hashing</span>, and{" "}
            <span className="text-emerald-300 font-semibold">Error Level Analysis (ELA)</span>{" "}
            to auto-freeze NGO funds on-chain upon fraud detection with zero human gatekeepers.
          </p>
        </div>

        {/* ── THE GRAND CTA BUTTON (Prominent, High-Contrast, Glowing) ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <button
            id="btn-run-attack-story"
            onClick={handleStartStory}
            className="group relative inline-flex items-center justify-center gap-3.5 px-8 py-5 rounded-2xl text-lg sm:text-xl font-black tracking-tight text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-300 shadow-[0_0_35px_rgba(236,72,153,0.45)] hover:shadow-[0_0_60px_rgba(236,72,153,0.7)] animate-cta-glow transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] border border-white/25"
          >
            <span className="text-2xl group-hover:scale-125 transition-transform duration-300">
              🚀
            </span>
            <span>Run Complete Attack Story</span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-white/20 font-mono font-bold tracking-wider uppercase border border-white/30 text-white/95">
              20s Live Demo
            </span>
          </button>

          <Link
            href="/pitch"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 transition-all shadow-sm"
          >
            <span>🎯 1-Click Judge Pitch</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* ── CINEMATIC THEATER CANVAS ── */}
        <div
          ref={theaterRef}
          className={`relative rounded-3xl border transition-all duration-500 overflow-hidden shadow-2xl ${
            isClimax
              ? "cinema-red border-red-500/80 bg-[#120406]/95 animate-screen-shudder"
              : activeStage.escrowStatus === "ALERT"
              ? "border-amber-500/70 bg-[#140f06]/95"
              : "cinema-emerald border-slate-800 bg-slate-950/90"
          }`}
        >
          {/* Header Bar of the Theater */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  isClimax
                    ? "bg-red-500 animate-ping"
                    : activeStage.escrowStatus === "ALERT"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-emerald-400 animate-pulse"
                }`}
              />
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Live Autonomous Simulation Theater
              </span>
              <span className="hidden sm:inline text-xs text-slate-500">•</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                {activeStage.badge}
              </span>
            </div>

            {/* Stage Timeline Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "Pause" : currentTime >= TOTAL_DURATION ? "Replay" : "Play"}</span>
              </button>

              <button
                onClick={handleReset}
                title="Reset simulation to 0s"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <span className="text-xs font-mono font-bold text-slate-400">
                {currentTime.toFixed(1)}s / {TOTAL_DURATION.toFixed(1)}s
              </span>
            </div>
          </div>

          {/* ── 20-Second Progress Bar with Stage Tick Marks ── */}
          <div className="w-full bg-slate-900/80 h-2.5 relative border-b border-slate-800/80">
            <div
              className={`h-full transition-all duration-100 ${
                isClimax
                  ? "bg-gradient-to-r from-red-600 via-amber-500 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                  : activeStage.escrowStatus === "ALERT"
                  ? "bg-gradient-to-r from-indigo-500 via-amber-400 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                  : "bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              }`}
              style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
            />
            {/* Tick mark pills */}
            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
              {STORY_STAGES.map((s, idx) => (
                <div
                  key={s.id}
                  className="h-full w-0.5 bg-slate-700/60"
                  style={{ left: `${(s.timeRange[0] / TOTAL_DURATION) * 100}%` }}
                />
              ))}
            </div>
          </div>

          {/* ── 5 Stage Quick-Jump Selector Pills ── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-slate-950/70 border-b border-slate-800/60 text-xs font-mono">
            {STORY_STAGES.map((st) => {
              const isCurrent = activeStage.id === st.id;
              const isPast = currentTime > st.timeRange[1];
              return (
                <button
                  key={st.id}
                  onClick={() => handleJumpToStage(st)}
                  className={`px-3 py-2 rounded-xl text-left transition-all border flex items-center justify-between gap-1.5 ${
                    isCurrent
                      ? st.badgeColor === "red"
                        ? "bg-red-500/20 border-red-500/70 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)] font-bold"
                        : st.badgeColor === "amber"
                        ? "bg-amber-500/20 border-amber-500/70 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] font-bold"
                        : "bg-indigo-500/20 border-indigo-500/70 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)] font-bold"
                      : isPast
                      ? "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      : "bg-slate-900/30 border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <span className="truncate">{st.label}</span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Main Stage Showcase Screen ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8">
            {/* Left 7 Columns: Real-Time Visual State Matrix */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded tracking-wider border ${
                      activeStage.badgeColor === "red"
                        ? "bg-red-500/20 border-red-500/50 text-red-300"
                        : activeStage.badgeColor === "amber"
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                        : "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                    }`}
                  >
                    Stage {activeStage.id} of 5 • {activeStage.timeRange[0]}s–{activeStage.timeRange[1]}s
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Time: {currentTime.toFixed(1)}s
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 leading-tight">
                  {activeStage.headline}
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {activeStage.details}
                </p>
              </div>

              {/* Dynamic State Machine Display Card */}
              <div
                className={`p-5 rounded-2xl border transition-all duration-500 backdrop-blur-md ${
                  isClimax
                    ? "bg-red-950/40 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
                    : activeStage.escrowStatus === "ALERT"
                    ? "bg-amber-950/30 border-amber-500/50"
                    : "bg-slate-900/60 border-slate-800"
                }`}
              >
                {/* 3 Live Metric Badges */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">
                      Escrow Vault Status
                    </div>
                    <div
                      className={`text-sm sm:text-base font-black font-mono flex items-center gap-1.5 ${
                        isClimax
                          ? "text-red-400"
                          : activeStage.escrowStatus === "ALERT"
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {isClimax ? (
                        <>
                          <Lock className="w-4 h-4 shrink-0 text-red-400" />
                          <span>FROZEN</span>
                        </>
                      ) : activeStage.escrowStatus === "ALERT" ? (
                        <>
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>ALERT</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span>ACTIVE</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">
                      Vault Balance
                    </div>
                    <div className="text-sm sm:text-base font-black font-mono text-white">
                      {activeStage.vaultBalance.toFixed(1)} ETH
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">
                      Released / Protected
                    </div>
                    <div
                      className={`text-sm sm:text-base font-black font-mono ${
                        isClimax ? "text-red-400" : "text-indigo-300"
                      }`}
                    >
                      {isClimax
                        ? "40.0 ETH PROTECTED"
                        : `${activeStage.releasedAmount.toFixed(1)} ETH Disbursed`}
                    </div>
                  </div>
                </div>

                {/* Simulated Visual Artifact or Heatmap */}
                {isClimax || activeStage.id === 4 ? (
                  /* Red-Team Climax: ELA Heatmap & Forensic Flag */
                  <div className="p-4 rounded-xl bg-black/60 border border-red-500/40 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-mono font-bold text-red-300">
                          FORENSIC ELA HEATMAP • HIGH COMPRESSION ANOMALY
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                        SCORE: 38.7% (ALERT &gt; 15.0%)
                      </span>
                    </div>

                    {/* Synthetic Visual ELA Canvas Representation */}
                    <div className="w-full h-24 rounded-lg bg-[#0b0e17] border border-red-900/50 p-2 relative flex items-center justify-between overflow-hidden">
                      {/* Wireframe simulated receipt */}
                      <div className="space-y-1.5 w-1/2">
                        <div className="h-2 w-3/4 rounded bg-slate-800" />
                        <div className="h-2 w-1/2 rounded bg-slate-800" />
                        <div className="h-2 w-5/6 rounded bg-slate-800" />
                      </div>

                      {/* Hot Tampered Region */}
                      <div className="w-44 h-16 rounded border-2 border-red-500 bg-red-600/30 flex flex-col items-center justify-center text-center p-1 relative shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                        <span className="text-[10px] font-mono font-bold text-red-200">
                          TAMPERED TOTAL
                        </span>
                        <span className="text-xs font-mono font-black text-white">
                          ₹45,000 (CROPPED)
                        </span>
                        <span className="text-[9px] text-red-300 font-mono">
                          Hamming Dist: 2 &lt; 5
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] font-mono text-red-200 flex items-center justify-between">
                      <span>Collision: Claimed in Donor_Pool_A</span>
                      <span className="text-red-400 font-bold">CIRCUIT BREAKER: TRIPPED</span>
                    </div>
                  </div>
                ) : activeStage.id === 3 ? (
                  /* Stage 3: Scanning Invariants */
                  <div className="p-4 rounded-xl bg-black/60 border border-indigo-500/40 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileSearch className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-mono font-bold text-indigo-300">
                          AI SCANNING ENGINE: DCT PERCEPTUAL HASH & ELA
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        SCANNING...
                      </span>
                    </div>

                    {/* Scanning Beam Visual */}
                    <div className="w-full h-20 rounded-lg bg-slate-900 border border-indigo-900/60 p-3 relative overflow-hidden flex items-center justify-between">
                      <div className="absolute inset-0 scan-beam pointer-events-none" />
                      <div>
                        <div className="text-xs font-mono text-slate-300">
                          Invoice: <span className="text-indigo-400 font-bold">INV-2026-8841</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-1">
                          Semantic Nullifier: 0x6e21a9b8d4c177e0...
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs text-indigo-300">
                        <div>DCT pHash: a4f09b22c1d88310</div>
                        <div className="text-[10px] text-emerald-400">ELA Baseline: 4.2% (PASS)</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Stages 1 & 2: Active Clean Escrow State */
                  <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-mono font-bold text-emerald-300">
                          ON-CHAIN ESCROW MILESTONES (10 / 15 / 15 / 10 ETH)
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        50.0 ETH TOTAL
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                      <div
                        className={`p-2 rounded-lg border ${
                          activeStage.id >= 2
                            ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-bold"
                            : "bg-slate-900/80 border-slate-800 text-slate-400"
                        }`}
                      >
                        <div className="text-[10px] text-slate-400">Tranche 1</div>
                        <div className="text-xs">10.0 ETH</div>
                        <div className="text-[9px] mt-0.5">
                          {activeStage.id >= 2 ? "RELEASED" : "READY"}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg border bg-slate-900/80 border-slate-800 text-slate-400">
                        <div className="text-[10px] text-slate-400">Tranche 2</div>
                        <div className="text-xs">15.0 ETH</div>
                        <div className="text-[9px] mt-0.5">PENDING</div>
                      </div>

                      <div className="p-2 rounded-lg border bg-slate-900/80 border-slate-800 text-slate-400">
                        <div className="text-[10px] text-slate-400">Tranche 3</div>
                        <div className="text-xs">15.0 ETH</div>
                        <div className="text-[9px] mt-0.5">LOCKED</div>
                      </div>

                      <div className="p-2 rounded-lg border bg-slate-900/80 border-slate-800 text-slate-400">
                        <div className="text-[10px] text-slate-400">Tranche 4</div>
                        <div className="text-xs">10.0 ETH</div>
                        <div className="text-[9px] mt-0.5">LOCKED</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 Columns: Live Forensic Audit Terminal */}
            <div className="lg:col-span-5 flex flex-col h-full">
              <div className="terminal-window rounded-2xl flex-1 flex flex-col overflow-hidden border border-slate-800 shadow-xl min-h-[380px]">
                {/* Terminal Title Bar */}
                <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 ml-2">
                      terminal://blackhole.audit
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      EV_BLOCK #20491892
                    </span>
                  </div>
                </div>

                {/* Terminal Body with Streaming Logs */}
                <div className="p-4 flex-1 overflow-y-auto space-y-2 text-xs font-mono terminal-scroll">
                  {visibleLogs.length === 0 ? (
                    <div className="text-slate-500 italic flex items-center gap-2 pt-6 justify-center">
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>Ready to run simulation. Click the button above to begin...</span>
                    </div>
                  ) : (
                    visibleLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={`p-1.5 rounded transition-colors ${
                          log.level === "CRITICAL"
                            ? "bg-red-950/40 text-red-300 border-l-2 border-red-500"
                            : log.level === "WARN"
                            ? "bg-amber-950/40 text-amber-300 border-l-2 border-amber-500"
                            : log.level === "SUCCESS"
                            ? "bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500"
                            : "text-slate-300 hover:bg-slate-900/50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-slate-500 shrink-0 font-bold">
                            [{log.timeSec.toFixed(1)}s]
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1 rounded shrink-0 ${
                              log.level === "CRITICAL"
                                ? "bg-red-500/20 text-red-400"
                                : log.level === "WARN"
                                ? "bg-amber-500/20 text-amber-400"
                                : log.level === "SUCCESS"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-slate-800 text-indigo-300"
                            }`}
                          >
                            {log.source}
                          </span>
                          <span className="break-words leading-tight">{log.message}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Terminal Footer with Action Buttons */}
                <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="text-slate-400 flex items-center gap-1.5 truncate">
                    <span>Tx:</span>
                    <span className="text-slate-300 truncate max-w-[170px]">
                      {activeStage.activeTx}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCommitment(activeStage.activeTx)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px]"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Bar of Theater: Quick Skip & Manual Exploration ── */}
          <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Fault-Tolerant UX Principle:</span> All
              math proofs are bound directly to <code className="text-indigo-300 font-mono">campaign-seed.json</code> and work 100% offline.
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleJumpToStage(STORY_STAGES[4])}
                className="text-xs font-mono font-bold text-red-400 hover:text-red-300 underline underline-offset-4"
              >
                Fast-Forward to Climax (Stage 5)
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Skip / Reset
              </button>
            </div>
          </div>
        </div>

        {/* ── CORE PILLARS & ARCHITECTURE ── */}
        <div className="mt-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 mb-2">
              The Cryptographic Arsenal
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Why Naive OCR Fails & The Black Hole Ledger Wins
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-indigo-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                Deterministic Semantic Nullifiers
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Computes <code className="text-indigo-300 font-mono text-xs">keccak256(TaxID | InvNo | Date | Amount)</code>. Cropping 2px or re-saving JPEG changes the raw file hash, but the semantic nullifier remains mathematically identical, detecting cross-donor reuse immediately.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                <Eye className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                Dual-Tier Perceptual Hashing (pHash)
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                64-bit DCT fingerprint detects visual clones across rotated, compressed, or cropped receipt uploads. Hamming Distance &lt; 5 triggers immediate duplication alerts even when adversaries alter textual metadata.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-pink-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                Error Level Analysis (ELA) Pixel Forensics
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Analyzes compression variance matrices across 8x8 DCT blocks. Photoshopped numbers (e.g. inflating ₹62,000 to ₹3,85,000) display distinct compression artifacts (score 38.7% &gt; 15.0% threshold), halting payment before release.
              </p>
            </div>
          </div>
        </div>

        {/* ── INTERACTIVE MODULE LAUNCHPAD ── */}
        <div className="mt-16 p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-black text-white">Manual Deep-Dive Explorations</h3>
              <p className="text-sm text-slate-400">
                Explore every dimension of the protocol through dedicated live engines.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30">
              5 INTERACTIVE APPS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/red-team"
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-red-500/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">⚡</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-red-300 transition-colors">
                Red-Team Engine
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Stress-test receipts against 2px image crop mutations, 30% batch forgeries, and double-spends.
              </p>
            </Link>

            <Link
              href="/flow-tracer"
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">🌐</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                Flow-Tracer DAG
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                5-hop money DAG visualizer tracking bridge slippage skimming and 142 ZK-shielded rural households.
              </p>
            </Link>

            <Link
              href="/dashboard"
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">🏛️</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                Escrow & Tranches
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Monitor the 10/15/15/10 ETH drip schedule, lock emergency freezes, and verify vendor payouts.
              </p>
            </Link>

            <Link
              href="/donate"
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">💳</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                Dual-Rail Gateway
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Donate in Crypto (ETH, USDC) or Fiat (UPI, Card, SEPA) with real-time Chainlink oracle pricing.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
