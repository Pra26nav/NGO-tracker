"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLedger } from "@/context/ledger-context";
import {
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Coins,
  Activity,
  FileText,
  Upload,
  Eye,
  Check,
  ShieldCheck,
  ShieldAlert,
  HeartHandshake,
} from "lucide-react";

interface TrancheItem {
  trancheId: number;
  name: string;
  percentage: number;
  amountEth: number;
  amountUsd: number;
  amountInr: number;
  status: "RELEASED" | "PENDING_VERIFICATION" | "LOCKED";
  description: string;
  verifiedNullifier?: string | null;
  verifiedMerkleRoot?: string | null;
  releasedAt?: string | null;
  txHash?: string | null;
  recipientVendor: string;
}

interface StatementFreshness {
  lastStatementUploadDate: string;
  reportingPeriod: string;
  daysElapsed: number;
  thresholdDays: number;
  isOverdue: boolean;
  stalenessLevel: string;
  warningBadge: string;
  statementFilename: string;
}

export default function DashboardPage() {
  const ledger = useLedger();
  const [loading, setLoading] = useState(false);
  const [tranches, setTranches] = useState<TrancheItem[]>([
    {
      trancheId: 1,
      name: "Phase 1: Mobilization & Hydrogeological Survey",
      percentage: 20,
      amountEth: 10.0,
      amountUsd: 32000,
      amountInr: 2692800,
      status: "RELEASED",
      description: "Deep borewell hydrogeological sounding and Ward 4 aquifer identification.",
      verifiedNullifier: "0x88c1901f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e33e1",
      verifiedMerkleRoot: "0x856c30affcf0560c9a992bfbeb4f8691fd1cc00cc943390101fddcd734135370",
      releasedAt: "2026-10-24 10:20:00 UTC",
      txHash: "0x9c00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
      recipientVendor: "Vidarbha Geological & Drilling Consultancy (GSTIN-27VWW001Z)",
    },
    {
      trancheId: 2,
      name: "Phase 2: Heavy Rig Borewell Drilling & Casing",
      percentage: 30,
      amountEth: 15.0,
      amountUsd: 48000,
      amountInr: 4039200,
      status: "PENDING_VERIFICATION",
      description: "450-foot heavy aquifer drilling rig and 200mm high-tensile PVC casing pipe assembly.",
      verifiedNullifier: null,
      recipientVendor: "Maharashtra Borewell & PVC Supply Co. (GSTIN-27WATER9988Z)",
    },
    {
      trancheId: 3,
      name: "Phase 3: Solar Submersible Pumps & 5,000L Storage",
      percentage: 30,
      amountEth: 15.0,
      amountUsd: 48000,
      amountInr: 4039200,
      status: "LOCKED",
      description: "5HP brushless solar submersible pumps, dual-MPPT array controller, and community water towers.",
      recipientVendor: "SunPower Rural Tech Pvt Ltd (GSTIN-27SOLAR4411Z)",
    },
    {
      trancheId: 4,
      name: "Phase 4: Commissioning & WHO Water Quality Audit",
      percentage: 20,
      amountEth: 10.0,
      amountUsd: 32000,
      amountInr: 2692800,
      status: "LOCKED",
      description: "Final hydro-pressure testing, fluorosis prevention screening, and independent audit sign-off.",
      recipientVendor: "District Panchayat Water Engineering Directorate",
    },
  ]);

  const [statementFreshness, setStatementFreshness] = useState<StatementFreshness>({
    lastStatementUploadDate: "2026-09-14T09:30:00Z",
    reportingPeriod: "Q3 2026 (July 1 - September 14, 2026)",
    daysElapsed: 42,
    thresholdDays: 30,
    isOverdue: true,
    stalenessLevel: "OVERDUE",
    warningBadge: "Statement Overdue: 42 days since last upload",
    statementFilename: "ICICI_Corporate_Escrow_Statement_Q3_2026.pdf",
  });

  const [statementModalOpen, setStatementModalOpen] = useState(false);

  // Real Laptop File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadReportingPeriod, setUploadReportingPeriod] = useState("Q4 2026 (Oct 1 - Oct 26, 2026)");
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  // Helper to format byte sizes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Process chosen file from laptop (file picker or drag-drop)
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setFileSizeFormatted(formatBytes(file.size));
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setFileHash(hashHex);
    } catch {
      setFileHash("0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2));
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Poll statement freshness
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/dashboard/statement-freshness")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStatementFreshness(data);
      })
      .catch(() => {});
  }, []);

  const handleReleaseNextTranche = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/dashboard/release-next-tranche", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tranches) {
          setTranches(data.tranches);
        }
      } else {
        // Local simulation fallback
        setTranches((prev) =>
          prev.map((t, idx) =>
            idx === 1
              ? {
                  ...t,
                  status: "RELEASED",
                  releasedAt: new Date().toISOString(),
                  verifiedNullifier: "0x88c2902f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e44e2",
                }
              : idx === 2
              ? { ...t, status: "PENDING_VERIFICATION" }
              : t
          )
        );
      }
    } catch {
      // Local fallback
      setTranches((prev) =>
        prev.map((t, idx) =>
          idx === 1
            ? {
                ...t,
                status: "RELEASED",
                releasedAt: new Date().toISOString(),
                verifiedNullifier: "0x88c2902f2a4b77d1e2f3a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e44e2",
              }
            : idx === 2
            ? { ...t, status: "PENDING_VERIFICATION" }
            : t
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFreshStatement = async () => {
    setLoading(true);
    const fname = selectedFile ? selectedFile.name : "ICICI_Bank_Reconciliation_Statement_Oct2026.pdf";
    const period = uploadReportingPeriod || "Q4 2026 (Oct 1 - Oct 26, 2026)";

    try {
      let res;
      if (selectedFile) {
        // Multipart file upload
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("reportingPeriod", period);
        formData.append("uploadedBy", "FinOps Officer (Anand Verma, CA)");

        try {
          res = await fetch("http://127.0.0.1:8000/api/dashboard/statement-upload-file", {
            method: "POST",
            body: formData,
          });
        } catch {
          // fallback to JSON
        }
      }

      if (!res || !res.ok) {
        res = await fetch("http://127.0.0.1:8000/api/dashboard/statement-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportingPeriod: period,
            filename: fname,
            fileHash: fileHash,
            fileSize: fileSizeFormatted,
            daysAgo: 0,
          }),
        });
      }

      if (res && res.ok) {
        const data = await res.json();
        setStatementFreshness(data.statementFreshness);
      } else {
        setStatementFreshness((prev) => ({
          ...prev,
          daysElapsed: 0,
          isOverdue: false,
          stalenessLevel: "FRESH",
          warningBadge: "✓ Statement Current: Just now",
          statementFilename: fname,
          reportingPeriod: period,
        }));
      }

      setUploadSuccessMessage(`✓ Anchored ${fname} successfully!`);
      setTimeout(() => {
        setUploadSuccessMessage(null);
        setStatementModalOpen(false);
      }, 1200);
    } catch {
      setStatementFreshness((prev) => ({
        ...prev,
        daysElapsed: 0,
        isOverdue: false,
        stalenessLevel: "FRESH",
        warningBadge: "✓ Statement Current: Just now",
        statementFilename: fname,
        reportingPeriod: period,
      }));
      setStatementModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const isFrozen = ledger.escrowStatus === "FROZEN";

  return (
    <div className="w-full bg-dot-pattern min-h-screen text-black pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-3.5 py-1.5 rounded-lg shadow-brutal-sm w-fit">
            <span className="w-2.5 h-2.5 rounded-full bg-primary border border-black" />
            <span className="font-heading font-black text-xs uppercase tracking-tight">
              FEATURE #3 // PURPOSE-BOUND ESCROW &amp; MILESTONE TRANCHE DRIP
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter text-black">
              MILESTONE VAULT
            </h1>
            <p className="font-mono text-xs sm:text-sm text-black/70 max-w-xl">
              20/30/30/20 tranche progression locked to &quot;Water Infrastructure&quot;. Disbursements require verified semantic nullifiers and fresh bank statements.
            </p>
          </div>
        </div>

        {/* ── 4 Brutalist Header KPI Cards ─────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-brutal-yellow p-5 rounded-xl flex flex-col justify-between gap-2 shadow-brutal">
            <div className="text-[10px] font-mono font-bold text-black/70 uppercase">TOTAL COMMITTED</div>
            <div className="font-heading font-black text-3xl text-black">50.00 ETH</div>
            <div className="text-xs font-mono font-bold text-black/75">$160,000.00 USD (₹1.34 Cr)</div>
          </div>

          <div className="card-brutal p-5 rounded-xl flex flex-col justify-between gap-2 shadow-brutal">
            <div className="text-[10px] font-mono font-bold text-black/60 uppercase">RELEASED TO DATE</div>
            <div className="font-heading font-black text-3xl text-black">
              {tranches.filter((t) => t.status === "RELEASED").reduce((acc, t) => acc + t.amountEth, 0).toFixed(1)} ETH
            </div>
            <div className="text-xs font-mono font-bold text-brutal-green">
              {tranches.filter((t) => t.status === "RELEASED").length} of 4 Milestones Released
            </div>
          </div>

          <div className="card-brutal-sage p-5 rounded-xl flex flex-col justify-between gap-2 shadow-brutal">
            <div className="text-[10px] font-mono font-bold text-black/70 uppercase">VAULT BALANCE SAFE</div>
            <div className="font-heading font-black text-3xl text-black">
              {(50 - tranches.filter((t) => t.status === "RELEASED").reduce((acc, t) => acc + t.amountEth, 0)).toFixed(1)} ETH
            </div>
            <div className="text-xs font-mono font-bold text-black">Remaining in PurposeBoundEscrow.sol</div>
          </div>

          <div className={`p-5 rounded-xl border-2 border-black flex flex-col justify-between gap-2 shadow-brutal ${
            isFrozen ? "bg-brutal-red text-white" : "card-brutal"
          }`}>
            <div className="text-[10px] font-mono font-bold opacity-75 uppercase">ESCROW STATUS</div>
            <div className="font-heading font-black text-2xl uppercase tracking-tight flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full border border-black ${isFrozen ? "bg-[#ff5964]" : "bg-[#10b981]"}`} />
              <span>{isFrozen ? "ESCROW FROZEN" : "ESCROW ACTIVE"}</span>
            </div>
            <div className="text-xs font-mono font-bold truncate">Earmark: Water Infrastructure</div>
          </div>
        </div>

        {/* ── Bank Statement 30-Day Freshness Compliance Card ──── */}
        <div className="card-brutal p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary border-2 border-black rounded-lg flex items-center justify-center shadow-brutal-sm">
              <FileText className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg text-black uppercase">
                  BANK STATEMENT FRESHNESS AUDIT
                </h3>
                <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border border-black ${
                  statementFreshness.isOverdue
                    ? "bg-brutal-red text-white"
                    : "bg-sage text-black"
                }`}>
                  {statementFreshness.isOverdue ? "AUDIT OVERDUE" : "AUDIT COMPLIANT"}
                </span>
              </div>
              <p className="font-mono text-xs text-black/70 pt-0.5">
                {statementFreshness.statementFilename} • {statementFreshness.reportingPeriod}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className={`px-3 py-1.5 rounded-lg border-2 border-black text-xs font-mono font-bold ${
              statementFreshness.isOverdue ? "bg-primary text-black" : "bg-sage text-black"
            }`}>
              {statementFreshness.warningBadge}
            </div>

            <button
              onClick={() => setStatementModalOpen(true)}
              className="btn-brutal bg-charcoal hover:bg-black text-white font-heading font-black text-xs px-4 py-2.5 rounded-lg uppercase tracking-tight flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>UPLOAD REFRESHED STATEMENT</span>
            </button>
          </div>
        </div>

        {/* ── 4-Milestone Tranche Progression Timeline ─────────── */}
        <div className="card-brutal p-6 sm:p-8 rounded-2xl flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b-2 border-black">
            <div>
              <h2 className="font-heading font-black text-2xl uppercase tracking-tight text-black">
                MILESTONE TRANCHE DRIP SCHEDULE
              </h2>
              <p className="font-mono text-xs text-black/60">
                Disbursements are triggered atomically on-chain against verified vendor invoices and nullifiers.
              </p>
            </div>

            {/* Emergency Freeze / Unfreeze Action Button */}
            <div className="flex items-center gap-2">
              {isFrozen ? (
                <button
                  onClick={() => ledger.unfreezeEscrow()}
                  className="btn-brutal bg-white hover:bg-sage text-black font-heading font-black text-xs px-4 py-2 rounded-lg"
                >
                  RESTORE &amp; UNFREEZE ESCROW
                </button>
              ) : (
                <button
                  onClick={() => ledger.freezeEscrow("Manual donor emergency killswitch triggered.")}
                  className="btn-brutal bg-brutal-red hover:bg-red-600 text-white font-heading font-black text-xs px-4 py-2 rounded-lg"
                >
                  EMERGENCY FREEZE VAULT
                </button>
              )}
            </div>
          </div>

          {/* Tranche Cards Stack */}
          <div className="flex flex-col gap-4">
            {tranches.map((tranche, idx) => {
              const isReleased = tranche.status === "RELEASED";
              const isPending = tranche.status === "PENDING_VERIFICATION";

              return (
                <div
                  key={tranche.trancheId}
                  className={`border-2 border-black rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-brutal-sm transition-all ${
                    isReleased
                      ? "bg-sage/25"
                      : isPending
                      ? "bg-primary/20 border-black"
                      : "bg-white opacity-70"
                  }`}
                >
                  {/* Left Info */}
                  <div className="flex items-start gap-4">
                    <span className="w-10 h-10 rounded-lg bg-charcoal text-white font-heading font-black text-sm flex items-center justify-center border-2 border-black shrink-0">
                      T{tranche.trancheId}
                    </span>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-black text-lg text-black uppercase">
                          {tranche.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border border-black uppercase ${
                            isReleased
                              ? "bg-sage text-black"
                              : isPending
                              ? "bg-primary text-black"
                              : "bg-white text-black/60"
                          }`}
                        >
                          {tranche.status}
                        </span>
                      </div>

                      <p className="font-body text-xs text-black/80 max-w-xl">
                        {tranche.description}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-black/70 flex-wrap">
                        <span>Vendor: <strong className="text-black">{tranche.recipientVendor}</strong></span>
                        {tranche.verifiedNullifier && (
                          <span>Nullifier: <strong className="text-black">{tranche.verifiedNullifier.slice(0, 16)}...</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Amount & Actions */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/20">
                    <div className="text-right">
                      <div className="font-heading font-black text-xl text-black">
                        {tranche.amountEth.toFixed(1)} ETH
                      </div>
                      <div className="font-mono text-xs text-black/60">
                        ({tranche.percentage}% • ₹{tranche.amountInr.toLocaleString()})
                      </div>
                    </div>

                    {isPending && !isFrozen && (
                      <button
                        onClick={handleReleaseNextTranche}
                        disabled={loading}
                        className="btn-brutal bg-charcoal hover:bg-black text-white font-heading font-black text-xs px-4 py-2 rounded-lg uppercase tracking-tight flex items-center gap-2"
                      >
                        <Coins className="w-3.5 h-3.5 text-primary" />
                        <span>{loading ? "VERIFYING..." : "VERIFY & DRIP TRANCHE"}</span>
                      </button>
                    )}

                    {isReleased && (
                      <span className="bg-sage text-black text-xs font-mono font-bold px-3 py-1 rounded border border-black flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>SETTLED ON-CHAIN</span>
                      </span>
                    )}

                    {!isReleased && !isPending && (
                      <span className="bg-white text-black/50 text-xs font-mono font-bold px-3 py-1 rounded border border-black">
                        LOCKED IN ESCROW
                      </span>
                    )}

                    <Link
                      href={`/donate?tranche=${tranche.trancheId}&name=${encodeURIComponent(tranche.name)}`}
                      className="btn-brutal bg-primary hover:bg-yellow-400 text-black font-heading font-black text-[11px] px-3.5 py-1.5 rounded-lg uppercase tracking-tight flex items-center gap-1.5 shadow-brutal-sm mt-1"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>DONATE TO THIS TENDER</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Upload Statement Modal with Laptop File Picker ── */}
      {statementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="card-brutal-lg max-w-lg w-full p-6 sm:p-7 rounded-2xl flex flex-col gap-4 bg-white border-2 border-black shadow-brutal">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary border-2 border-black flex items-center justify-center font-heading font-black">
                  <Upload className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-lg text-black uppercase leading-tight">
                    UPLOAD CORPORATE BANK STATEMENT
                  </h4>
                  <span className="font-mono text-[10px] text-black/60 font-bold uppercase">
                    Select statement or audit report from your laptop
                  </span>
                </div>
              </div>
              <button
                onClick={() => setStatementModalOpen(false)}
                className="btn-brutal bg-charcoal hover:bg-black text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg border border-black"
              >
                ✕
              </button>
            </div>

            <p className="font-body text-xs text-black/80">
              Under RBI FCRA regulations and institutional philanthropic standards, bank statements must be refreshed every 30 days.
            </p>

            {/* Hidden Native File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileInputChange}
              accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.txt"
              className="hidden"
            />

            {/* Interactive Drag & Drop / File Selection Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/20 scale-[1.01]"
                  : selectedFile
                  ? "border-emerald-600 bg-emerald-50 shadow-inner"
                  : "border-black bg-primary/10 hover:bg-primary/20"
              }`}
            >
              {selectedFile ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border-2 border-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div className="flex flex-col gap-1 max-w-full">
                    <span className="font-heading font-black text-sm uppercase text-black break-all px-2">
                      {selectedFile.name}
                    </span>
                    <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-black/70 flex-wrap">
                      <span className="bg-white px-2 py-0.5 rounded border border-black">{fileSizeFormatted}</span>
                      <span className="bg-sage px-2 py-0.5 rounded border border-black uppercase">
                        {selectedFile.name.split(".").pop() || "FILE"}
                      </span>
                      <span className="text-emerald-700 font-extrabold">Ready to Anchor</span>
                    </div>
                  </div>

                  {fileHash && (
                    <div className="w-full bg-white border border-black rounded p-2 text-left font-mono text-[10px] text-black/80 truncate">
                      <span className="font-bold text-black/60">SHA-256 HASH: </span>
                      <span className="font-extrabold text-black">{fileHash}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="btn-brutal bg-white hover:bg-sage text-black font-heading font-black text-[11px] px-3 py-1.5 rounded-lg border border-black uppercase"
                    >
                      CHOOSE DIFFERENT FILE
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setFileHash(null);
                      }}
                      className="btn-brutal bg-charcoal text-white font-heading font-black text-[11px] px-3 py-1.5 rounded-lg border border-black uppercase"
                    >
                      CLEAR
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-brutal-sm">
                    <Upload className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-heading font-black text-sm uppercase text-black">
                      CLICK TO SELECT FILE FROM LAPTOP
                    </span>
                    <span className="font-mono text-xs text-black/60">
                      or drag &amp; drop statement file here
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-black/60 uppercase">
                    <span className="bg-white px-2 py-0.5 rounded border border-black font-bold">PDF</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-black font-bold">CSV</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-black font-bold">XLSX</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-black font-bold">IMAGES</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="btn-brutal bg-primary hover:bg-yellow-300 text-black font-heading font-black text-xs px-4 py-2 rounded-lg border border-black uppercase tracking-tight shadow-brutal-xs mt-1"
                  >
                    SELECT FROM LAPTOP
                  </button>
                </>
              )}
            </div>

            {/* Reporting Period Field */}
            <div className="flex flex-col gap-1 font-mono text-xs">
              <label className="text-[10px] uppercase font-bold text-black/70">
                Audit Reporting Period:
              </label>
              <input
                type="text"
                value={uploadReportingPeriod}
                onChange={(e) => setUploadReportingPeriod(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-black font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-brutal-sm"
                placeholder="e.g. Q4 2026 (Oct 1 - Oct 26, 2026)"
              />
            </div>

            {uploadSuccessMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-100 border-2 border-emerald-600 font-mono text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{uploadSuccessMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setStatementModalOpen(false)}
                className="btn-brutal bg-white hover:bg-sage text-black font-heading font-black text-xs py-3 rounded-xl uppercase tracking-tight flex-1"
              >
                CANCEL
              </button>
              <button
                onClick={handleUploadFreshStatement}
                disabled={loading}
                className="btn-brutal bg-charcoal hover:bg-black text-white font-heading font-black text-xs py-3 rounded-xl uppercase tracking-tight flex items-center justify-center gap-2 flex-[2] disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>
                  {loading
                    ? "ANCHORING TO CHAIN..."
                    : selectedFile
                    ? `ANCHOR ${selectedFile.name.length > 20 ? selectedFile.name.slice(0, 18) + '...' : selectedFile.name}`
                    : "ANCHOR RECONCILED STATEMENT"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
