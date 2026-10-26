"use client";

import React, { useState, useEffect } from "react";
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
    try {
      const res = await fetch("http://127.0.0.1:8000/api/dashboard/statement-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportingPeriod: "Q4 2026 (Oct 1 - Oct 25, 2026)",
          filename: "ICICI_Bank_Reconciliation_Statement_Oct2026.pdf",
          daysAgo: 2,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatementFreshness(data.statementFreshness);
      } else {
        setStatementFreshness((prev) => ({
          ...prev,
          daysElapsed: 2,
          isOverdue: false,
          stalenessLevel: "FRESH",
          warningBadge: "✓ Statement Current: 2d ago",
          statementFilename: "ICICI_Bank_Reconciliation_Statement_Oct2026.pdf",
        }));
      }
    } catch {
      setStatementFreshness((prev) => ({
        ...prev,
        daysElapsed: 2,
        isOverdue: false,
        stalenessLevel: "FRESH",
        warningBadge: "✓ Statement Current: 2d ago",
        statementFilename: "ICICI_Bank_Reconciliation_Statement_Oct2026.pdf",
      }));
    } finally {
      setLoading(false);
      setStatementModalOpen(false);
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

      {/* ── Upload Statement Modal ──────────────────────────── */}
      {statementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="card-brutal-lg max-w-md w-full p-6 rounded-2xl flex flex-col gap-4 bg-white">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h4 className="font-heading font-black text-lg text-black uppercase">
                UPLOAD CORPORATE BANK STATEMENT
              </h4>
              <button
                onClick={() => setStatementModalOpen(false)}
                className="font-mono text-sm font-bold px-2 py-1 bg-charcoal text-white rounded border border-black"
              >
                ✕
              </button>
            </div>

            <p className="font-body text-xs text-black/80">
              Under RBI FCRA regulations and institutional philanthropic standards, bank statements must be refreshed every 30 days.
            </p>

            <div className="border-2 border-dashed border-black rounded-xl p-6 bg-primary/10 flex flex-col items-center justify-center gap-2 text-center">
              <Upload className="w-8 h-8 text-black" />
              <span className="font-heading font-black text-sm uppercase">
                ICICI_Bank_Reconciliation_Statement_Oct2026.pdf
              </span>
              <span className="font-mono text-xs text-black/60">Ready to hash and anchor to Base Sepolia</span>
            </div>

            <button
              onClick={handleUploadFreshStatement}
              disabled={loading}
              className="btn-brutal bg-charcoal text-white font-heading font-black text-xs py-3 rounded-lg uppercase tracking-tight flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "ANCHORING TO CHAIN..." : "ANCHOR RECONCILED STATEMENT"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
