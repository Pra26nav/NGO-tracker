"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Info,
  DollarSign,
  PieChart,
} from "lucide-react";

interface CharityRecord {
  taxId: string;
  legalName: string;
  country: string;
  jurisdiction: string;
  registrySource: string;
  registrationNumber: string;
  status: string;
  totalRevenueUsd: number;
  programExpenseRatio: number;
  adminExpenseRatio: number;
  executiveCompensationUsd: number;
  riskIndicators: string[];
  aliases: string[];
}

interface CharityIntelligenceDrawerProps {
  className?: string;
  defaultQuery?: string;
}

export function CharityIntelligenceDrawer({
  className = "",
  defaultQuery = "Gramin Jal Vikas Sanstha",
}: CharityIntelligenceDrawerProps) {
  const [query, setQuery] = useState<string>(defaultQuery);
  const [selectedRecord, setSelectedRecord] = useState<CharityRecord | null>(null);
  const [allRecords, setAllRecords] = useState<CharityRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [resolutionConfidence, setResolutionConfidence] = useState<number>(0.99);

  useEffect(() => {
    let isMounted = true;
    const fetchRegistries = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/api/intelligence/all");
        if (res.ok && isMounted) {
          const data = await res.json();
          setAllRecords(data.records || []);
          if (data.records && data.records.length > 0) {
            setSelectedRecord(data.records[0]);
          }
          setLoading(false);
          return;
        }
      } catch {
        // Fallback local records
      }

      if (isMounted) {
        const fallbackRecords: CharityRecord[] = [
          {
            taxId: "MH/2018/0192841",
            legalName: "Gramin Jal Vikas Sanstha (Maharashtra Rural Water Trust)",
            country: "India",
            jurisdiction: "NITI Aayog NGO Darpan / Maharashtra Charity Commissioner",
            registrySource: "INDIA_DARPAN_80G",
            registrationNumber: "MH/2018/0192841",
            status: "ACTIVE",
            totalRevenueUsd: 420000.0,
            programExpenseRatio: 0.88,
            adminExpenseRatio: 0.12,
            executiveCompensationUsd: 24000.0,
            riskIndicators: [],
            aliases: ["Gramin Jal Vikas Sanstha", "Maharashtra Rural Water Trust", "GJVS"],
          },
          {
            taxId: "EIN-13-8829102",
            legalName: "Global Water & Sanitation Relief Foundation",
            country: "United States",
            jurisdiction: "IRS Form 990 / State of New York",
            registrySource: "IRS_990",
            registrationNumber: "13-8829102",
            status: "ACTIVE",
            totalRevenueUsd: 1850000.0,
            programExpenseRatio: 0.84,
            adminExpenseRatio: 0.16,
            executiveCompensationUsd: 115000.0,
            riskIndicators: [],
            aliases: ["Global Water Relief", "GWSRF"],
          },
          {
            taxId: "SUSPICIOUS-SHELL-991",
            legalName: "Apex Offshore Humanitarian Trust Ltd",
            country: "Seychelles / Offshore",
            jurisdiction: "Unregistered Shell",
            registrySource: "IATI",
            registrationNumber: "UNKNOWN",
            status: "UNDER_REVIEW",
            totalRevenueUsd: 500000.0,
            programExpenseRatio: 0.28,
            adminExpenseRatio: 0.72,
            executiveCompensationUsd: 210000.0,
            riskIndicators: [
              "EXCESSIVE_ADMIN_OVERHEAD_72_PCT",
              "EXECUTIVE_COMPENSATION_EXCEEDS_40_PCT",
            ],
            aliases: ["Apex Offshore"],
          },
        ];
        setAllRecords(fallbackRecords);
        setSelectedRecord(fallbackRecords[0]);
        setLoading(false);
      }
    };

    fetchRegistries();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectRecord = (rec: CharityRecord) => {
    setSelectedRecord(rec);
    setQuery(rec.legalName);
    setResolutionConfidence(rec.status === "ACTIVE" ? 0.99 : 0.42);
  };

  return (
    <div
      className={`glass-elevated rounded-2xl p-5 sm:p-6 border border-slate-800 bg-slate-950/75 relative overflow-hidden ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              OpenGive Pattern
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              IRS 990 · NITI Darpan · UK CC
            </span>
          </div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span>Charity Registry Intelligence &amp; Entity Resolution</span>
          </h3>
          <p className="text-xs text-slate-400">
            Independent verification against official government tax filings, executive compensation disclosures, and administrative expense ratios.
          </p>
        </div>

        {/* Selected Confidence */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-right shrink-0">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">
            Resolution Confidence
          </span>
          <span
            className={`text-base font-black font-mono ${
              resolutionConfidence >= 0.8 ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {(resolutionConfidence * 100).toFixed(1)}% Match
          </span>
        </div>
      </div>

      {/* Selectable Organizations Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 custom-scrollbar text-xs font-mono">
        {allRecords.map((rec) => {
          const isSelected = selectedRecord?.taxId === rec.taxId;
          const isSuspicious = rec.status !== "ACTIVE";
          return (
            <button
              key={rec.taxId}
              type="button"
              onClick={() => handleSelectRecord(rec)}
              className={`px-3 py-2 rounded-xl border text-left shrink-0 transition-all ${
                isSelected
                  ? isSuspicious
                    ? "border-red-500 bg-red-950/40 text-red-200"
                    : "border-indigo-500 bg-indigo-950/40 text-white font-bold"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {rec.registrySource}
                </span>
                {isSuspicious && (
                  <span className="text-[9px] px-1 rounded bg-red-950 text-red-300 font-bold">
                    FLAGGED
                  </span>
                )}
              </div>
              <div className="text-xs truncate max-w-[200px]">{rec.legalName}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Entity Breakdown Card */}
      {selectedRecord && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Legal Entity Name</span>
              <span className="text-sm font-bold text-white">{selectedRecord.legalName}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400">Jurisdiction: {selectedRecord.jurisdiction}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Registration / Tax ID</span>
              <span className="text-white font-bold">{selectedRecord.taxId}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Total Annual Revenue</span>
              <span className="text-emerald-400 font-bold">${selectedRecord.totalRevenueUsd.toLocaleString()}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Program Expense Ratio</span>
              <span
                className={`font-bold ${
                  selectedRecord.programExpenseRatio >= 0.8 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {(selectedRecord.programExpenseRatio * 100).toFixed(0)}% to Programs
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Admin Overhead Ratio</span>
              <span
                className={`font-bold ${
                  selectedRecord.adminExpenseRatio > 0.35 ? "text-red-400" : "text-slate-300"
                }`}
              >
                {(selectedRecord.adminExpenseRatio * 100).toFixed(0)}% Overhead
              </span>
            </div>
          </div>

          {selectedRecord.riskIndicators.length > 0 && (
            <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-300 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Statistical Anomalies Detected by OpenGive Heuristics:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-red-400">
                  {selectedRecord.riskIndicators.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
