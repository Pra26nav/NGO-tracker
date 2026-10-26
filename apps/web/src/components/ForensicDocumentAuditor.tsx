"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Crosshair,
  Sliders,
  ZoomIn,
  ZoomOut,
  ScanLine,
  Layers,
  Activity,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Maximize2,
  Eye,
  FileText,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

export interface ForensicDocumentAuditorProps {
  receipt: {
    receiptId: string;
    vendorName: string;
    vendorTaxId: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalAmount: string;
    detectedCategory: string;
    expectedCategory: string;
    categoryMatch: boolean;
    sha256Hash: string;
    perceptualHash: string;
    semanticNullifier: string;
    isDuplicateNullifier: boolean;
    duplicatePoolSource?: string | null;
    isPerceptualClone: boolean;
    hammingDistance: number;
    elaAnomalyScore: number;
    elaHeatmapBase64?: string | null;
    merkleRoot: string;
    verdict?: string;
    failureReason?: string | null;
  };
  activeScenario: string;
}

export function ForensicDocumentAuditor({
  receipt,
  activeScenario,
}: ForensicDocumentAuditorProps) {
  // View Modes: WIPE_COMPARISON | HEATMAP | RAW_INVOICE | DCT_GRID
  const [viewMode, setViewMode] = useState<
    "WIPE_COMPARISON" | "HEATMAP" | "RAW_INVOICE" | "DCT_GRID"
  >("WIPE_COMPARISON");

  // Wipe slider position (0% - 100%, defaults to 52%)
  const [sliderPosition, setSliderPosition] = useState<number>(52);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Optical Calibrations
  const [qFactor, setQFactor] = useState<70 | 85 | 95>(85);
  const [colorMap, setColorMap] = useState<"INFERNO" | "SPECTRAL" | "VIRIDIS" | "MONO">("INFERNO");
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // Live Cursor Tracking & HUD coordinates
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringCanvas, setIsHoveringCanvas] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const isTampered = (receipt?.elaAnomalyScore || 0) > 15.0;

  // Handle Dragging Split Slider
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      setCursorPos({
        x: Math.round(x),
        y: Math.round(y),
      });

      if (isDraggingSlider) {
        const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
        setSliderPosition(Math.round(percent));
      }
    },
    [isDraggingSlider]
  );

  const handlePointerUp = useCallback(() => {
    setIsDraggingSlider(false);
  }, []);

  useEffect(() => {
    const handleGlobalUp = () => setIsDraggingSlider(false);
    window.addEventListener("pointerup", handleGlobalUp);
    return () => window.removeEventListener("pointerup", handleGlobalUp);
  }, []);

  // Determine if cursor is currently inspecting the tampered region
  const isNearTamperedROI =
    cursorPos &&
    cursorPos.x >= 320 &&
    cursorPos.x <= 580 &&
    cursorPos.y >= 75 &&
    cursorPos.y <= 185;

  return (
    <div className="window-brutal shadow-brutal-lg bg-white overflow-hidden flex flex-col">
      {/* ── Title Bar (Tactical Charcoal HUD) ── */}
      <div className="bg-[#171e19] px-4 py-3 border-b-2 border-black flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2">
          <span className="window-dot bg-[#ff5f56] border border-black" />
          <span className="window-dot bg-[#ffbd2e] border border-black" />
          <span className="window-dot bg-[#27c93f] border border-black" />
          <span className="text-white text-xs font-mono font-bold ml-1.5 flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-primary" />
            <span>OPTICAL MICROSCOPY FORENSIC KERNEL // ELA-V2.4</span>
            <span className="text-white/40">|</span>
            <span className="text-primary font-mono">{receipt?.invoiceNumber || "INV-2026-8841"}</span>
          </span>
        </div>

        {/* Status Pill Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-black border border-black uppercase flex items-center gap-1.5 ${
              isTampered
                ? "bg-[#ff5964] text-white animate-pulse"
                : "bg-[#10b981] text-black"
            }`}
          >
            {isTampered ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>[TAMPERING CONFIRMED: PEAK {receipt?.elaAnomalyScore || 38.7} dB]</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>[HOMOGENEOUS BASELINE: {receipt?.elaAnomalyScore || 4.2} dB PASS]</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* ── Viewport Control Toolbar ── */}
      <div className="bg-[#f0ece1] px-4 py-2 border-b-2 border-black flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-black/60 font-bold text-[10px] mr-1 uppercase">MODE:</span>
          <button
            onClick={() => setViewMode("WIPE_COMPARISON")}
            className={`btn-brutal text-[10px] font-mono font-bold px-2.5 py-1 rounded transition-all ${
              viewMode === "WIPE_COMPARISON"
                ? "bg-primary text-black font-extrabold border-2 border-black"
                : "bg-white text-black border border-black hover:bg-sage/40"
            }`}
          >
            WIPE COMPARISON (SLIDER)
          </button>
          <button
            onClick={() => setViewMode("HEATMAP")}
            className={`btn-brutal text-[10px] font-mono font-bold px-2.5 py-1 rounded transition-all ${
              viewMode === "HEATMAP"
                ? "bg-primary text-black font-extrabold border-2 border-black"
                : "bg-white text-black border border-black hover:bg-sage/40"
            }`}
          >
            ELA HEATMAP
          </button>
          <button
            onClick={() => setViewMode("RAW_INVOICE")}
            className={`btn-brutal text-[10px] font-mono font-bold px-2.5 py-1 rounded transition-all ${
              viewMode === "RAW_INVOICE"
                ? "bg-primary text-black font-extrabold border-2 border-black"
                : "bg-white text-black border border-black hover:bg-sage/40"
            }`}
          >
            RAW INVOICE SCAN
          </button>
          <button
            onClick={() => setViewMode("DCT_GRID")}
            className={`btn-brutal text-[10px] font-mono font-bold px-2.5 py-1 rounded transition-all ${
              viewMode === "DCT_GRID"
                ? "bg-primary text-black font-extrabold border-2 border-black"
                : "bg-white text-black border border-black hover:bg-sage/40"
            }`}
          >
            8x8 DCT BLOCKS
          </button>
        </div>

        {/* Optical Calibrations */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-black/60 font-bold text-[10px] uppercase">Q-FACTOR:</span>
            {[70, 85, 95].map((q) => (
              <button
                key={q}
                onClick={() => setQFactor(q as 70 | 85 | 95)}
                className={`btn-brutal text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  qFactor === q
                    ? "bg-[#171e19] text-white border-2 border-black"
                    : "bg-white text-black border border-black hover:bg-primary"
                }`}
              >
                Q={q}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-black/20 hidden sm:block" />

          {/* Zoom Toggle */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className={`btn-brutal text-[10px] font-mono font-bold px-2.5 py-0.5 rounded flex items-center gap-1 border border-black ${
              isZoomed ? "bg-sage text-black font-black" : "bg-white text-black hover:bg-sage/40"
            }`}
          >
            {isZoomed ? <ZoomOut className="w-3 h-3" /> : <ZoomIn className="w-3 h-3" />}
            <span>{isZoomed ? "1.0x NORMAL" : "2.0x LOUPE"}</span>
          </button>
        </div>
      </div>

      {/* ── Main Document Stage & Interactive Canvas ── */}
      <div className="p-4 sm:p-5 bg-[#faf8f4] flex flex-col gap-4">
        <div
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerEnter={() => setIsHoveringCanvas(true)}
          onPointerLeave={() => {
            setIsHoveringCanvas(false);
            setCursorPos(null);
          }}
          className={`relative w-full h-[360px] sm:h-[420px] rounded-lg border-2 border-black overflow-hidden select-none bg-[#0a0d14] shadow-brutal-sm ${
            isDraggingSlider ? "cursor-ew-resize" : "cursor-crosshair"
          }`}
        >
          {/* Zoom Wrapper */}
          <div
            className={`w-full h-full relative transition-transform duration-200 ${
              isZoomed ? "scale-125 origin-center" : "scale-100"
            }`}
          >
            {/* ══════════════════════════════════════════════════════════════════
                LAYER 1: RAW AUTHENTIC SCANNED INVOICE (BASE PAPER LAYER)
               ══════════════════════════════════════════════════════════════════ */}
            <div className="absolute inset-0 w-full h-full bg-[#fcfbfa] text-black font-mono p-4 sm:p-6 overflow-hidden flex flex-col justify-between">
              {/* Paper Background Grid lines */}
              <div
                className="absolute inset-0 opacity-[0.035] pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />

              {/* Scanned Document Header */}
              <div>
                <div className="flex items-start justify-between border-b-2 border-black pb-2.5">
                  <div>
                    <div className="text-[9px] font-bold text-black/60 uppercase tracking-widest">
                      TAX INVOICE · FORM 16A · VERIFIED VENDOR DISBURSEMENT
                    </div>
                    <div className="font-heading font-black text-lg sm:text-2xl uppercase tracking-tight text-black leading-tight">
                      {receipt?.vendorName || "Nagpur Hydro Pipes Pvt Ltd"}
                    </div>
                    <div className="text-[10px] text-black/70 font-bold mt-0.5">
                      GSTIN: {receipt?.vendorTaxId || "27AAACW1234F1Z5"} · PAN: AAACN8841F · WARDHA MIDC
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-block bg-primary border border-black px-2 py-0.5 rounded text-[10px] font-black uppercase">
                      INVOICE #{receipt?.invoiceNumber || "INV-2026-8841"}
                    </div>
                    <div className="text-[10px] text-black/60 font-bold mt-1">
                      DATE: {receipt?.invoiceDate || "2026-10-24"}
                    </div>
                    <div className="text-[9px] text-black/40">E-WAY: 8841-9920-1122</div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="mt-3 border border-black rounded overflow-hidden">
                  <div className="bg-[#171e19] text-white text-[9px] font-bold grid grid-cols-12 px-2.5 py-1">
                    <span className="col-span-1">#</span>
                    <span className="col-span-6">ITEM DESCRIPTION</span>
                    <span className="col-span-2 text-center">HSN/SAC</span>
                    <span className="col-span-1 text-center">QTY</span>
                    <span className="col-span-2 text-right">TOTAL (INR)</span>
                  </div>

                  <div className="bg-white text-[11px] grid grid-cols-12 px-2.5 py-2 font-bold border-b border-black/20 items-center">
                    <span className="col-span-1 text-black/50">01</span>
                    <span className="col-span-6 text-black">
                      {activeScenario === "VALID_MILESTONE"
                        ? "3x Submersible Borewell Pumps 5HP & 200mm Heavy PVC Casing"
                        : "1x HDPE Water Storage Tank 5000L Triple Layer (Anti-Bacterial)"}
                    </span>
                    <span className="col-span-2 text-center text-black/60 text-[10px]">8413.70</span>
                    <span className="col-span-1 text-center text-black">1 UN</span>
                    <span className="col-span-2 text-right font-black text-black">
                      {receipt?.totalAmount}
                    </span>
                  </div>

                  <div className="bg-[#f7f5ed] text-[10px] grid grid-cols-12 px-2.5 py-1 text-black/60 font-bold">
                    <span className="col-span-10 text-right">CGST (9.0%) + SGST (9.0%) INCLUDED:</span>
                    <span className="col-span-2 text-right">INCLUDED</span>
                  </div>
                </div>
              </div>

              {/* Total & Official Stamp Section */}
              <div className="flex items-end justify-between pt-2 border-t border-black/20 mt-2">
                {/* Official Panchayat Stamp */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-blue-900/40 p-1 flex items-center justify-center text-center rotate-[-8deg] select-none pointer-events-none">
                    <div className="w-full h-full rounded-full border border-dashed border-blue-900/60 flex flex-col items-center justify-center text-[7px] font-black text-blue-900 leading-tight">
                      <span>RAMESHWAR</span>
                      <span className="font-bold">VERIFIED</span>
                      <span>PANCHAYAT</span>
                    </div>
                  </div>

                  <div className="text-[9px] text-black/60 leading-tight">
                    <div>ON-CHAIN NULLIFIER ENCLAVE:</div>
                    <div className="font-bold text-black font-mono">
                      {receipt?.semanticNullifier?.slice(0, 24)}...
                    </div>
                    <div className="text-black/40">CAMPAIGN: CLEAN WATER INFRASTRUCTURE</div>
                  </div>
                </div>

                {/* Amount Box */}
                <div
                  className={`border-2 p-2.5 sm:p-3 rounded-lg text-right min-w-[200px] ${
                    isTampered
                      ? "border-[#ff0055] bg-red-500/10 shadow-[0_0_10px_rgba(255,0,85,0.15)]"
                      : "border-black bg-primary/20"
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] font-bold text-black/70 mb-0.5">
                    <span>{isTampered ? "[TAMPER TARGET ROI]" : "[VERIFIED DISBURSEMENT]"}</span>
                    <span>Q=85 EVM</span>
                  </div>
                  <div className="font-heading font-black text-xl sm:text-2xl text-black">
                    {receipt?.totalAmount}
                  </div>
                  <div className="text-[9px] text-black/60 font-bold">
                    {activeScenario === "VALID_MILESTONE" ? "EVM RELEASE: 10.0 ETH" : "ESCROW: FROZEN"}
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                LAYER 2: FORENSIC ELA HEATMAP (CLIPPED BY SLIDER OR FULL)
               ══════════════════════════════════════════════════════════════════ */}
            {(viewMode === "WIPE_COMPARISON" || viewMode === "HEATMAP") && (
              <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  clipPath:
                    viewMode === "WIPE_COMPARISON"
                      ? `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
                      : "none",
                }}
              >
                {/* ELA SVG Thermal Reconstruction */}
                <svg
                  className="w-full h-full"
                  viewBox="0 0 640 360"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Thermal Core Anomaly Glow */}
                    <radialGradient id="tamperHeat" cx="74%" cy="72%" r="28%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="18%" stopColor="#ffff00" stopOpacity="0.95" />
                      <stop offset="42%" stopColor="#ff2200" stopOpacity="0.9" />
                      <stop offset="68%" stopColor="#cc0066" stopOpacity="0.75" />
                      <stop offset="88%" stopColor="#4d0080" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#080c18" stopOpacity="0" />
                    </radialGradient>

                    {/* Technical Forensic Grid Pattern */}
                    <pattern id="matrixGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                      <rect width="16" height="16" fill="#080b14" />
                      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#121828" strokeWidth="0.75" />
                      <circle cx="8" cy="8" r="0.6" fill="#1e2740" />
                    </pattern>

                    {/* Clean Speckle Noise */}
                    <pattern id="cleanSpeckle" width="4" height="4" patternUnits="userSpaceOnUse">
                      <rect width="4" height="4" fill="none" />
                      <rect x="0" y="0" width="1.2" height="1.2" fill="#182338" opacity="0.5" />
                      <rect x="2" y="2" width="1.2" height="1.2" fill="#243452" opacity="0.35" />
                    </pattern>
                  </defs>

                  {/* Dark Forensic Canvas Base */}
                  <rect width="640" height="360" fill="url(#matrixGrid)" />
                  <rect width="640" height="360" fill="url(#cleanSpeckle)" />

                  {/* Ghosted Invoice Wireframe Geometry */}
                  <g stroke="#1b243b" strokeWidth="1" strokeDasharray="2,4" opacity="0.6">
                    <rect x="25" y="20" width="590" height="320" fill="none" />
                    <line x1="25" y1="75" x2="615" y2="75" />
                    <line x1="25" y1="120" x2="615" y2="120" />
                    <line x1="25" y1="230" x2="615" y2="230" />
                  </g>

                  {/* Ghosted Text Energy Traces (< 6.0 dB) */}
                  <g fill="#273550" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="600">
                    <text x="35" y="45">TAX INVOICE [UNIFORM RESIDUAL: 4.2 dB]</text>
                    <text x="35" y="65">{receipt?.vendorName?.toUpperCase()}</text>
                    <text x="460" y="45">INV-REF: {receipt?.invoiceNumber}</text>
                    <text x="35" y="145">ITEM: WATER INFRASTRUCTURE PIPES &amp; HARDWARE</text>
                    <text x="35" y="165">BASELINE COMPRESSION HOMOGENEITY: 99.4%</text>
                  </g>

                  {/* ── CONDITIONAL: TAMPERED ANOMALY OR CLEAN PASS ── */}
                  {isTampered ? (
                    <>
                      {/* Thermal Anomaly Heat Core Over Amount */}
                      <rect x="360" y="200" width="245" height="110" rx="4" fill="url(#tamperHeat)" />

                      {/* 8x8 DCT Macroblock Grid Artifacts Over Amount */}
                      <g stroke="#ffff00" strokeWidth="0.8" opacity="0.7">
                        <line x1="390" y1="210" x2="390" y2="295" strokeDasharray="2,2" />
                        <line x1="430" y1="210" x2="430" y2="295" strokeDasharray="2,2" />
                        <line x1="470" y1="210" x2="470" y2="295" strokeDasharray="2,2" />
                        <line x1="510" y1="210" x2="510" y2="295" strokeDasharray="2,2" />
                        <line x1="550" y1="210" x2="550" y2="295" strokeDasharray="2,2" />

                        <line x1="380" y1="230" x2="590" y2="230" strokeDasharray="2,2" />
                        <line x1="380" y1="250" x2="590" y2="250" strokeDasharray="2,2" />
                        <line x1="380" y1="270" x2="590" y2="270" strokeDasharray="2,2" />
                      </g>

                      {/* Crosshair Target Reticle */}
                      <g stroke="#ff0055" strokeWidth="1.8">
                        <path d="M 400 220 L 380 220 L 380 240" fill="none" />
                        <path d="M 570 220 L 590 220 L 590 240" fill="none" />
                        <path d="M 380 275 L 380 295 L 400 295" fill="none" />
                        <path d="M 590 275 L 590 295 L 570 295" fill="none" />
                        <rect x="390" y="228" width="190" height="58" fill="none" stroke="#ffff00" strokeWidth="1.2" strokeDasharray="4,2" />
                      </g>

                      {/* Target Text & Spliced Diagnostic Tags */}
                      <text
                        x="405"
                        y="266"
                        fill="#ffffff"
                        fontFamily="'JetBrains Mono', monospace"
                        fontSize="20"
                        fontWeight="900"
                        letterSpacing="1"
                      >
                        {receipt?.totalAmount}
                      </text>

                      {/* Data Callout Tags */}
                      <rect x="390" y="200" width="190" height="16" fill="#171e19" stroke="#ff0055" strokeWidth="1" />
                      <text x="398" y="212" fill="#ff4466" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" fontWeight="bold">
                        ROI-01: SPLICED DIGIT INSERTION
                      </text>

                      <rect x="390" y="295" width="190" height="16" fill="#171e19" stroke="#ffff00" strokeWidth="1" />
                      <text x="398" y="307" fill="#ffff00" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="bold">
                        RESAVE ERROR: +{receipt?.elaAnomalyScore || 38.7} dB PEAK
                      </text>
                    </>
                  ) : (
                    <>
                      {/* Clean Uniform Pass Geometry */}
                      <rect x="30" y="80" width="580" height="220" fill="#10b981" fillOpacity="0.04" stroke="#10b981" strokeWidth="0.8" strokeDasharray="4,4" />
                      <rect x="380" y="235" width="210" height="50" fill="#082218" stroke="#10b981" strokeWidth="1.2" />
                      <text x="395" y="255" fill="#10b981" fontFamily="'JetBrains Mono', monospace" fontSize="10" fontWeight="bold">
                        100% UNIFORM QUANTIZATION
                      </text>
                      <text x="395" y="272" fill="#6ee7b7" fontFamily="'JetBrains Mono', monospace" fontSize="9">
                        MAX DELTA: 4.2 dB (&lt;= 15.0 dB PASS)
                      </text>
                    </>
                  )}

                  {/* Calibration Thermal Spectrum Scale (Bottom Strip) */}
                  <g transform="translate(25, 335)">
                    <text x="0" y="9" fill="#94a3b8" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="bold">
                      0.0 dB
                    </text>
                    <defs>
                      <linearGradient id="auditorSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="30%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="70%" stopColor="#f59e0b" />
                        <stop offset="90%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#ffffff" />
                      </linearGradient>
                    </defs>
                    <rect x="40" y="2" width="510" height="8" rx="2" fill="url(#auditorSpectrum)" stroke="#000000" strokeWidth="1" />
                    {/* 15.0 dB Threshold Marker */}
                    <line x1="346" y1="0" x2="346" y2="12" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="290" y="-3" fill="#ff5964" fontFamily="'JetBrains Mono', monospace" fontSize="7.5" fontWeight="bold">
                      THRESHOLD: 15.0 dB
                    </text>
                    <text x="560" y="9" fill="#ff0055" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="bold">
                      50 dB
                    </text>
                  </g>
                </svg>

                {/* Top-Left Mode Indicator Badge */}
                <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-sm border border-white/20 px-2 py-0.5 rounded text-[9px] font-mono text-primary font-bold">
                  ELA MATRIX // THERMAL SPECTRAL RESIDUALS
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                LAYER 3: 8x8 DCT MACROBLOCK GRID (WHEN DCT_GRID MODE ACTIVE)
               ══════════════════════════════════════════════════════════════════ */}
            {viewMode === "DCT_GRID" && (
              <div className="absolute inset-0 w-full h-full bg-[#0a0d14]/90 p-4 font-mono text-xs flex flex-col justify-between">
                <div className="text-[10px] text-primary font-bold border-b border-primary/30 pb-1">
                  8x8 PIXEL DCT MACROBLOCK QUANTIZATION MATRIX
                </div>
                {/* Visual DCT Grid with high-heat highlighted block */}
                <div className="grid grid-cols-12 gap-1 my-2 flex-1 items-center">
                  {Array.from({ length: 48 }).map((_, idx) => {
                    const isHot = isTampered && idx >= 28 && idx <= 34;
                    return (
                      <div
                        key={idx}
                        className={`h-6 border flex items-center justify-center text-[7px] font-bold ${
                          isHot
                            ? "border-[#ff0055] bg-red-600/40 text-white animate-pulse"
                            : "border-white/10 bg-white/5 text-white/40"
                        }`}
                      >
                        {isHot ? "+38.7" : "4.1"}
                      </div>
                    );
                  })}
                </div>
                <div className="text-[9px] text-white/60">
                  DISCONTINUITY: {isTampered ? "0.94 (HIGH SPLICING PROBABILITY)" : "0.02 (UNIFORM)"}
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              INTERACTIVE WIPE SLIDER DIVIDER & TACTILE HANDLE
             ══════════════════════════════════════════════════════════════════ */}
          {viewMode === "WIPE_COMPARISON" && (
            <div
              className="absolute top-0 bottom-0 z-30 cursor-ew-resize group"
              style={{ left: `${sliderPosition}%` }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsDraggingSlider(true);
              }}
            >
              {/* Vertical Divider Line */}
              <div className="absolute top-0 bottom-0 left-[-1.5px] w-[3px] bg-black shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
              <div className="absolute top-0 bottom-0 left-[-0.5px] w-[1px] bg-primary" />

              {/* Tactile Brutalist Center Handle */}
              <div className="absolute top-1/2 left-[-55px] -translate-y-1/2 w-[110px] bg-primary border-2 border-black rounded px-2 py-1 shadow-brutal-sm flex items-center justify-center gap-1 text-[9px] font-mono font-black text-black select-none pointer-events-auto hover:bg-[#ffea9f]">
                <span>◀ SLIDE ▶</span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              INTERACTIVE CURSOR CROSSHAIR & LIVE COORDINATE HUD
             ══════════════════════════════════════════════════════════════════ */}
          {isHoveringCanvas && cursorPos && !isDraggingSlider && (
            <>
              {/* Horizontal Crosshair Line */}
              <div
                className="absolute left-0 right-0 h-[1px] bg-primary/40 pointer-events-none z-20"
                style={{ top: `${cursorPos.y}px` }}
              />
              {/* Vertical Crosshair Line */}
              <div
                className="absolute top-0 bottom-0 w-[1px] bg-primary/40 pointer-events-none z-20"
                style={{ left: `${cursorPos.x}px` }}
              />

              {/* Floating Reticle HUD Pill */}
              <div
                className="absolute z-20 pointer-events-none bg-[#171e19]/95 text-white border border-black rounded px-2 py-1 text-[9px] font-mono shadow-brutal-sm flex items-center gap-2"
                style={{
                  left: cursorPos.x > 380 ? `${cursorPos.x - 170}px` : `${cursorPos.x + 15}px`,
                  top: cursorPos.y > 280 ? `${cursorPos.y - 45}px` : `${cursorPos.y + 15}px`,
                }}
              >
                <Crosshair className="w-3 h-3 text-primary shrink-0" />
                <div>
                  <div className="font-bold text-primary">
                    X:{cursorPos.x} Y:{cursorPos.y}
                  </div>
                  <div className={isNearTamperedROI ? "text-[#ff5964] font-black" : "text-white/70"}>
                    {isNearTamperedROI
                      ? "ANOMALY: +38.7 dB [SPLICED]"
                      : "ENERGY: 4.2 dB [UNIFORM]"}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Bottom Alert Pill */}
          {isTampered && (
            <div className="absolute bottom-2 right-2 z-20 bg-[#ff5964] text-white font-mono text-[9px] font-black px-2.5 py-1 rounded border border-black shadow-brutal-sm">
              [SPLICING CONFIRMED: RESAMPLE ERROR &gt; 15.0 dB]
            </div>
          )}
        </div>

        {/* ── Spectral Frequency Energy Distribution (Histogram HUD) ── */}
        <div className="border-2 border-black rounded-lg p-3.5 bg-white shadow-brutal-sm">
          <div className="flex items-center justify-between pb-2 border-b border-black/10 text-xs font-mono">
            <div className="flex items-center gap-1.5 font-black text-black">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>SPECTRAL ERROR LEVEL ENERGY HISTOGRAM (0..50 dB)</span>
            </div>
            <span className="text-[10px] font-mono text-black/60 font-bold">
              THRESHOLD = 15.0 dB
            </span>
          </div>

          {/* 6-Bin Histogram Bar Graph */}
          <div className="grid grid-cols-6 gap-2 mt-3 text-center font-mono">
            {[
              { bin: "0-5 dB", val: isTampered ? 48 : 82, label: "BASE NOISE", alert: false },
              { bin: "5-10 dB", val: isTampered ? 24 : 14, label: "TEXT EDGES", alert: false },
              { bin: "10-15 dB", val: isTampered ? 8 : 4, label: "MAX SAFE", alert: false },
              { bin: "15-25 dB", val: isTampered ? 12 : 0, label: "SUSPECT", alert: true },
              { bin: "25-35 dB", val: isTampered ? 34 : 0, label: "TAMPER", alert: true },
              { bin: "35-50 dB", val: isTampered ? 68 : 0, label: "SPLICED", alert: true },
            ].map((col, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="text-[9px] font-bold text-black/60">{col.val}%</div>
                <div className="w-full h-14 bg-[#f0ece1] border border-black rounded relative flex items-end overflow-hidden">
                  <div
                    className={`w-full transition-all duration-300 ${
                      col.alert && col.val > 0
                        ? "bg-[#ff5964] border-t border-black"
                        : "bg-[#171e19]"
                    }`}
                    style={{ height: `${col.val}%` }}
                  />
                  {idx === 2 && (
                    <div className="absolute top-0 bottom-0 right-0 w-[1.5px] bg-[#ff0055] stroke-dashed" />
                  )}
                </div>
                <div className="text-[9px] font-black text-black mt-0.5">{col.bin}</div>
                <div
                  className={`text-[8px] font-bold px-1 rounded ${
                    col.alert && col.val > 0 ? "bg-red-100 text-[#ff0055]" : "text-black/50"
                  }`}
                >
                  {col.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4 Forensic Verification Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
          <div className="card-brutal p-3 bg-white">
            <div className="text-[10px] font-bold text-black/60 uppercase">COMPRESSION DELTA</div>
            <div className="font-heading font-black text-base mt-0.5 text-black">
              {receipt?.elaAnomalyScore || (isTampered ? 38.7 : 4.2)} dB
            </div>
            <div
              className={`text-[9px] font-bold mt-1 ${
                isTampered ? "text-[#ff0055]" : "text-[#10b981]"
              }`}
            >
              {isTampered ? "[ANOMALY > 15.0 dB]" : "[UNIFORM COMPRESSION PASS]"}
            </div>
          </div>

          <div className="card-brutal p-3 bg-white">
            <div className="text-[10px] font-bold text-black/60 uppercase">Q-FACTOR MATCH</div>
            <div className="font-heading font-black text-base mt-0.5 text-black">
              {isTampered ? "Q=72 / Q=85 MISMATCH" : "Q=85 IJG (100% MATCH)"}
            </div>
            <div className="text-[9px] text-black/60 font-bold mt-1">
              {isTampered ? "[RESAVED DIFFERENTIAL]" : "[UNIFORM JPEG QUANTIZATION]"}
            </div>
          </div>

          <div className="card-brutal p-3 bg-white">
            <div className="text-[10px] font-bold text-black/60 uppercase">DCT BLOCK ENTROPY</div>
            <div className="font-heading font-black text-base mt-0.5 text-black">
              {isTampered ? "H = 7.84 bits/px" : "H = 3.12 bits/px"}
            </div>
            <div className="text-[9px] text-black/60 font-bold mt-1">
              {isTampered ? "[HIGH-FREQUENCY SPLICING]" : "[NATURAL SENSOR NOISE]"}
            </div>
          </div>

          <div className="card-brutal p-3 bg-white">
            <div className="text-[10px] font-bold text-black/60 uppercase">ON-CHAIN ESCROW</div>
            <div className="font-heading font-black text-base mt-0.5 text-black">
              {isTampered ? "AUTO-FROZEN (0 ETH)" : "RELEASED (10.0 ETH)"}
            </div>
            <div
              className={`text-[9px] font-bold mt-1 ${
                isTampered ? "text-[#ff0055]" : "text-[#10b981]"
              }`}
            >
              {isTampered ? "[CIRCUIT BREAKER LOCKED]" : "[DISBURSEMENT EMITTED]"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForensicDocumentAuditor;
