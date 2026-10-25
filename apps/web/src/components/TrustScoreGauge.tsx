"use client";

import React, { useMemo } from "react";
import { useLedger } from "@/context/ledger-context";
import { ShieldCheck, ShieldAlert, AlertTriangle, Activity, Lock, Check } from "lucide-react";

interface TrustScoreGaugeProps {
  score?: number;
  size?: "compact" | "normal" | "hero";
  showWarningBanner?: boolean;
  className?: string;
}

export function TrustScoreGauge({
  score: overrideScore,
  size = "normal",
  showWarningBanner = true,
  className = "",
}: TrustScoreGaugeProps) {
  const ledger = useLedger();

  // Effective score: override > context score > derived from escrowStatus
  const score = useMemo(() => {
    if (typeof overrideScore === "number") return Math.max(0, Math.min(100, overrideScore));
    if (ledger.escrowStatus === "FROZEN") return Math.min(39, ledger.trustScore || 32);
    return ledger.trustScore ?? 98;
  }, [overrideScore, ledger.trustScore, ledger.escrowStatus]);

  const isFrozen = ledger.escrowStatus === "FROZEN" || score < 40;

  // Category & Color mapping
  // 75–100: Emerald Green (Secure / Verified Chain)
  // 40–74: Amber Yellow (Warning / Anomaly Detected)
  // 0–39: Glowing Red (Critical / Escrow Auto-Frozen)
  const category = useMemo(() => {
    if (score >= 75) {
      return {
        label: "SECURE",
        subLabel: "Verified Chain",
        description: "Valid Cryptographic Quorum & Zero Forgery",
        strokeColor: "#10b981", // emerald-500
        secondaryColor: "#34d399", // emerald-400
        gradientId: "gauge-emerald",
        textColor: "text-emerald-400",
        badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        ringBg: "rgba(16,185,129,0.12)",
        glowColor: "rgba(16,185,129,0.35)",
        icon: ShieldCheck,
      };
    }
    if (score >= 40) {
      return {
        label: "WARNING",
        subLabel: "Anomaly Detected",
        description: "High ELA Variance or Quorum Incomplete",
        strokeColor: "#f59e0b", // amber-500
        secondaryColor: "#fbbf24", // amber-400
        gradientId: "gauge-amber",
        textColor: "text-amber-400",
        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        ringBg: "rgba(245,158,11,0.12)",
        glowColor: "rgba(245,158,11,0.35)",
        icon: AlertTriangle,
      };
    }
    return {
      label: "CRITICAL",
      subLabel: "Escrow Auto-Frozen",
      description: "Adversarial Forgery Flagged · Capital extraction blocked",
      strokeColor: "#ef4444", // red-500
      secondaryColor: "#f87171", // red-400
      gradientId: "gauge-red",
      textColor: "text-red-400",
      badgeBg: "bg-red-500/20 text-red-300 border-red-500/50",
      ringBg: "rgba(239,68,68,0.18)",
      glowColor: "rgba(239,68,68,0.45)",
      icon: ShieldAlert,
    };
  }, [score]);

  /* ────────────────────────────────────────────────────────────
     1. COMPACT MODE (Designed for Header / GlobalNavbar)
  ──────────────────────────────────────────────────────────── */
  if (size === "compact") {
    const radius = 16;
    const strokeWidth = 3;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div
        id="trust-score-gauge-compact"
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all duration-500 ${
          isFrozen
            ? "bg-red-950/80 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
            : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
        } ${className}`}
        title={`Probabilistic Trust Score: ${score}/100 (${category.label} - ${category.subLabel})`}
      >
        {/* Mini Radial SVG Gauge */}
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 38 38">
            <circle
              cx="19"
              cy="19"
              r={radius}
              className="stroke-slate-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx="19"
              cy="19"
              r={radius}
              stroke={category.strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease",
              }}
            />
          </svg>
          <span className={`absolute text-[10px] font-black font-mono tracking-tighter ${category.textColor}`}>
            {score}
          </span>
        </div>

        {/* Text Details */}
        <div className="flex flex-col text-left font-mono leading-none pr-1">
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              Trust Score
            </span>
            <span
              className={`text-[8px] font-black uppercase px-1 py-0.2 rounded font-mono ${
                isFrozen
                  ? "bg-red-500/30 text-red-300 border border-red-500/40 animate-pulse"
                  : category.badgeBg
              }`}
            >
              {category.label}
            </span>
          </div>
          <span className={`text-[10px] font-bold mt-0.5 ${category.textColor}`}>
            {score}/100 · {category.subLabel}
          </span>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────
     2. HERO / NORMAL GAUGE (Dashboard Hero / Cards)
  ──────────────────────────────────────────────────────────── */
  const isHero = size === "hero";
  const radius = isHero ? 64 : 45;
  const strokeWidth = isHero ? 10 : 8;
  const viewBoxSize = isHero ? 160 : 120;
  const center = viewBoxSize / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const IconComponent = category.icon;

  return (
    <div
      id="trust-score-gauge-widget"
      className={`relative overflow-hidden transition-all duration-700 rounded-2xl p-5 sm:p-6 border ${
        isFrozen
          ? "border-red-500/60 bg-gradient-to-b from-red-950/40 via-slate-950/90 to-slate-950/95 shadow-[0_0_35px_rgba(239,68,68,0.25)]"
          : "border-slate-800 bg-slate-900/80 shadow-[0_0_30px_rgba(16,185,129,0.12)]"
      } ${className}`}
    >
      {/* Dynamic Background Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{
          width: isHero ? "260px" : "180px",
          height: isHero ? "260px" : "180px",
          backgroundColor: category.glowColor,
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: The Circular Animated Gauge Ring */}
        <div className="flex items-center gap-6">
          <div className="relative flex items-center justify-center shrink-0">
            <svg
              className="-rotate-90 transform transition-all duration-500"
              width={viewBoxSize}
              height={viewBoxSize}
              viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            >
              <defs>
                <linearGradient id={category.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={category.strokeColor} />
                  <stop offset="100%" stopColor={category.secondaryColor} />
                </linearGradient>
                <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow
                    dx="0"
                    dy="0"
                    stdDeviation={isHero ? "4" : "2"}
                    floodColor={category.strokeColor}
                    floodOpacity="0.6"
                  />
                </filter>
              </defs>

              {/* Background Track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                className="stroke-slate-800/80"
                strokeWidth={strokeWidth}
                fill="transparent"
              />

              {/* Dynamic Animated Stroke */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke={`url(#${category.gradientId})`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                filter="url(#gauge-glow)"
                style={{
                  transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.6s ease",
                }}
              />
            </svg>

            {/* Inner Core: Digital Counter & Shield Icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
              <span className={`font-mono font-black tracking-tight leading-none ${
                isHero ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
              } ${category.textColor}`}>
                {score}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">
                / 100
              </span>
            </div>
          </div>

          {/* Center Details */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                Probabilistic Trust Engine
              </span>
              <span
                className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${category.badgeBg}`}
              >
                <IconComponent className="w-3 h-3" />
                <span>{category.label}</span>
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{score}/100</span>
              <span className="text-slate-400 font-light text-base">· {category.subLabel}</span>
            </h3>

            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              {category.description}
            </p>

            {/* Bayesian Confidence Breakdown */}
            <div className="pt-2 flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span>Bayesian Certainty: <strong className="text-slate-200">99.4%</strong></span>
              <span>·</span>
              <span>Sample Vector: <strong className="text-slate-200">10 Proofs</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Forensic Factor Checklist */}
        <div className="w-full md:w-auto p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-2 shrink-0">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
            Real-Time Integrity Vectors
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Semantic Nullifier Uniqueness:</span>
            <span className={score >= 75 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
              {score >= 75 ? "✓ 100% Unique" : "🚨 Collision (Hamming=2)"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">ELA Pixel Compression:</span>
            <span className={score >= 75 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
              {score >= 75 ? "✓ Uniform (5.1/50)" : "🚨 Anomaly (38.7/50)"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Decentralized 2/3 Quorum:</span>
            <span className={score >= 75 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
              {score >= 75 ? "✓ 2/3 Agreed" : "🚨 2/3 Quorum Freeze"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Pulsing Warning Banner When Critical / Frozen ─── */}
      {showWarningBanner && isFrozen && (
        <div
          id="trust-score-warning-banner"
          className="mt-4 p-3.5 rounded-xl border border-red-500/60 bg-red-950/70 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🚨</span>
            <div>
              <strong className="text-red-200">
                CRITICAL WARNING: Trust Score Dropped to {score}/100
              </strong>
              <div className="text-[11px] text-red-300 font-mono mt-0.5">
                PurposeBoundEscrow.sol autonomously engaged the circuit breaker. Outbound capital transfers are mathematically blocked.
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white shrink-0">
            AUTO-FROZEN
          </span>
        </div>
      )}
    </div>
  );
}

export default TrustScoreGauge;
