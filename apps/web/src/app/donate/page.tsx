"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  QrCode,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Lock,
  Globe,
  Layers,
  Info,
} from "lucide-react";

interface PurposeOption {
  id: string;
  name: string;
  description: string;
  targetEth: number;
  raisedEth: number;
  category: string;
  verifiedVendor: string;
  keccak256Commitment: string;
}

interface RecentDonation {
  id: string;
  donor: string;
  amount: string;
  amountUsd: string;
  amountInr: string;
  rail: string;
  token: string;
  purpose: string;
  utrNumber?: string | null;
  txHash: string;
  status: string;
  timestamp: string;
  block: number;
}

const DEFAULT_PURPOSES: PurposeOption[] = [
  {
    id: "water-wardha",
    name: "Water Infrastructure - Wardha Cluster",
    description: "Deep-well borewells, solar pumps, and 5000L HDPE tanks for 142 drought-affected rural households.",
    targetEth: 50.0,
    raisedEth: 42.5,
    category: "Water Infrastructure",
    verifiedVendor: "Vidarbha Geological & Drilling Consultancy (GSTIN-27VWW001Z)",
    keccak256Commitment: "0x4f8a91b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e",
  },
  {
    id: "solar-purification",
    name: "Solar Fluoride Filtration & Water ATM",
    description: "Multi-stage reverse osmosis + solar microgrid ensuring safe potable water free from heavy minerals.",
    targetEth: 35.0,
    raisedEth: 21.0,
    category: "Water Infrastructure",
    verifiedVendor: "Apex Green Solar & Clean Water Ltd (GSTIN-27SOLAR4411Z)",
    keccak256Commitment: "0x89ab12cd34ef560718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f",
  },
  {
    id: "emergency-medical",
    name: "Emergency Rural Medical Clinics",
    description: "First-aid triage, anti-venom supplies, and maternal telemedicine kits for remote agricultural hamlets.",
    targetEth: 25.0,
    raisedEth: 25.0,
    category: "Medical Supplies",
    verifiedVendor: "Maharashtra Rural Health Care Trust (GSTIN-27MED1122Z)",
    keccak256Commitment: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  },
];

export default function DonatePage() {
  const [activeTab, setActiveTab] = useState<"CRYPTO" | "UPI">("CRYPTO");
  const [selectedPurposeId, setSelectedPurposeId] = useState<string>("water-wardha");
  
  // Crypto inputs
  const [cryptoToken, setCryptoToken] = useState<"ETH" | "USDC">("ETH");
  const [cryptoAmount, setCryptoAmount] = useState<number>(1.0);
  const [connectedWallet, setConnectedWallet] = useState<string>("0x71C9414B8B67B543D75e3Ea2E59E50Eb147Eb901");
  
  // Fiat UPI inputs
  const [fiatAmount, setFiatAmount] = useState<number>(25000);
  const [simulatedUtr, setSimulatedUtr] = useState<string>("UTR-2026-902184");
  const [upiPayerName, setUpiPayerName] = useState<string>("Ananya Sharma");

  // State & Loading
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [recentList, setRecentList] = useState<RecentDonation[]>([]);

  // Rates
  const ethUsd = 3200.0;
  const usdInr = 84.15;

  const activePurpose = useMemo(() => {
    return DEFAULT_PURPOSES.find((p) => p.id === selectedPurposeId) || DEFAULT_PURPOSES[0];
  }, [selectedPurposeId]);

  // Fetch initial options
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/donate/options")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.recentDonations) {
          setRecentList(data.recentDonations);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(text);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  // Submit donation
  const handleExecuteDonation = async () => {
    setIsSubmitting(true);
    const amount = activeTab === "CRYPTO" ? cryptoAmount : fiatAmount;
    const token = activeTab === "CRYPTO" ? cryptoToken : "INR";
    const donor = activeTab === "CRYPTO" ? connectedWallet : upiPayerName;

    try {
      const res = await fetch("http://127.0.0.1:8000/api/donate/simulate-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rail: activeTab,
          token,
          amount,
          purposeId: selectedPurposeId,
          donorIdentifier: donor,
          utrNumber: activeTab === "UPI" ? simulatedUtr : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReceiptData(data);
        setIsSubmitting(false);
        return;
      }
    } catch {
      // offline simulation fallback
    }

    // Offline receipt generation
    setTimeout(() => {
      const equivUsd = activeTab === "CRYPTO" ? (cryptoToken === "ETH" ? cryptoAmount * ethUsd : cryptoAmount) : fiatAmount / usdInr;
      const equivEth = equivUsd / ethUsd;
      const equivInr = equivUsd * usdInr;

      const receipt = {
        success: true,
        txHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        blockNumber: 20491890,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
        rail: activeTab,
        token,
        amountDeposited: amount,
        equivalentEth: Number(equivEth.toFixed(4)),
        equivalentUsd: Number(equivUsd.toFixed(2)),
        equivalentInr: Number(equivInr.toFixed(2)),
        donor,
        utrNumber: activeTab === "UPI" ? simulatedUtr : null,
        purposeBound: {
          purposeId: activePurpose.id,
          purposeName: activePurpose.name,
          category: activePurpose.category,
          keccak256Commitment: activePurpose.keccak256Commitment,
          rule: "100% of these funds are locked in PurposeBoundEscrow.sol. Capital can only release against cryptographically verified invoices.",
        },
        smartContract: {
          address: "0x3Af19B02cD319985E1e012399F319114d5e56E1",
          state: "ACTIVE_LOCKED",
          autonomousProtection: "Enabled (Semantic Nullifier + pHash duplicate check)",
        },
      };

      setReceiptData(receipt);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 grid-bg">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Hero */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dual-Rail Payment Gateway · Purpose-Bound Smart Escrow</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
              Direct-Impact Donation Gateway
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            Deposit crypto (ETH/USDC) or fiat INR via UPI with mathematical purpose-binding. Every single wei is autonomously locked in <code className="text-indigo-300 font-mono">PurposeBoundEscrow.sol</code> and cannot be skimmed, embezzled, or redirected.
          </p>
        </div>

        {/* Main Gateway Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Payment Configurator (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            
            {/* Step 1: Select Purpose Earmark */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Select Purpose Commitment (Cryptographic Earmark)</span>
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {DEFAULT_PURPOSES.map((p) => {
                  const isSelected = selectedPurposeId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPurposeId(p.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-100">{p.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {p.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">{p.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-indigo-300">{p.raisedEth} / {p.targetEth} ETH</div>
                          <div className="text-[9px] text-slate-500 uppercase font-mono">Funded</div>
                        </div>
                      </div>
                      
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate">Commitment: <span className="text-indigo-300">{p.keccak256Commitment.slice(0, 16)}…</span></span>
                        <span className="text-emerald-400 font-bold shrink-0">100% Earmarked</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Choose Payment Rail */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Select Payment Rail</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("CRYPTO")}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === "CRYPTO"
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>Web3 Crypto (ETH / USDC)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("UPI")}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === "UPI"
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Fiat UPI (INR &amp; NetBanking)</span>
                </button>
              </div>
            </div>

            {/* Step 3: Input Amount & Parameters */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
                <span>Donation Amount &amp; Currency</span>
              </label>

              {activeTab === "CRYPTO" ? (
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Amount to Deposit</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.1"
                        value={cryptoAmount}
                        onChange={(e) => setCryptoAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent text-2xl font-black text-slate-100 focus:outline-none font-mono"
                      />
                    </div>
                    
                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setCryptoToken("ETH")}
                        className={`px-3 py-1 rounded-md text-xs font-bold font-mono transition ${
                          cryptoToken === "ETH" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        ETH
                      </button>
                      <button
                        type="button"
                        onClick={() => setCryptoToken("USDC")}
                        className={`px-3 py-1 rounded-md text-xs font-bold font-mono transition ${
                          cryptoToken === "USDC" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        USDC
                      </button>
                    </div>
                  </div>

                  {/* Preset Amount Chips */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">Presets:</span>
                    {[0.5, 1.0, 2.5, 5.0, 10.0].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCryptoAmount(amt)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-800"
                      >
                        {amt} {cryptoToken}
                      </button>
                    ))}
                  </div>

                  {/* Valuation Breakdown */}
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Chainlink Reference:</span>
                    <span className="text-slate-200">
                      ≈ ${cryptoToken === "ETH" ? (cryptoAmount * ethUsd).toLocaleString() : cryptoAmount.toLocaleString()} USD
                      <span className="text-slate-400 ml-1.5">
                        (₹{cryptoToken === "ETH" ? ((cryptoAmount * ethUsd) * usdInr).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : (cryptoAmount * usdInr).toLocaleString("en-IN", { maximumFractionDigits: 0 })})
                      </span>
                    </span>
                  </div>

                  {/* Connected Wallet */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Depositing from:</span>
                    <span className="text-indigo-300 truncate max-w-[200px]">{connectedWallet}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Amount (INR ₹)</span>
                      <div className="flex items-center">
                        <span className="text-2xl font-black text-slate-400 mr-1 font-mono">₹</span>
                        <input
                          type="number"
                          min="500"
                          step="1000"
                          value={fiatAmount}
                          onChange={(e) => setFiatAmount(parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-2xl font-black text-slate-100 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs text-slate-400">Equivalent</div>
                      <div className="text-sm font-bold text-indigo-300">
                        ${(fiatAmount / usdInr).toFixed(2)} USDC
                      </div>
                    </div>
                  </div>

                  {/* Preset INR Chips */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-mono">Presets:</span>
                    {[5000, 10000, 25000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setFiatAmount(amt)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-800"
                      >
                        ₹{amt.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>

                  {/* UPI QR & VPA Box */}
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-lg p-1.5 shrink-0 flex items-center justify-center">
                      <QrCode className="w-full h-full text-slate-950" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-indigo-200">ICICI Escrow Virtual VPA</div>
                      <div className="font-mono text-slate-300 text-[11px] mt-0.5 select-all">cascade.escrow@icici</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Auto-minted to on-chain Polygon USDC upon bank webhook settlement.
                      </div>
                    </div>
                  </div>

                  {/* Simulated UTR */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Simulated Bank Reference:</span>
                    <span className="text-indigo-300 font-bold">{simulatedUtr}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Execute Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleExecuteDonation}
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Broadcasting Smart Contract Deposit…</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    Deposit &amp; Lock into PurposeBoundEscrow.sol (
                    {activeTab === "CRYPTO" ? `${cryptoAmount} ${cryptoToken}` : `₹${fiatAmount.toLocaleString("en-IN")}`}
                    )
                  </span>
                </>
              )}
            </button>

          </div>

          {/* Right Column: Escrow Rule & Recent On-Chain Audit (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* The Escrow Guarantee */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>The Black Hole Cryptographic Guarantee</span>
              </h3>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mathematical Purpose Binding:</strong> Funds can strictly only be disbursed if the vendor category matches <span className="text-indigo-300">{activePurpose.category}</span>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Anti-Double Spending:</strong> Semantic Nullifiers prevent NGOs from claiming the same invoice under multiple donors or pools.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Autonomous Red-Team Circuit Breaker:</strong> If Photoshop pixel tampering (ELA) or FX skimming is detected, escrow freezes automatically on-chain.
                  </span>
                </li>
              </ul>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
                Contract: <span className="text-indigo-300">PurposeBoundEscrow.sol</span>
                <br />
                Address: <span className="text-slate-300">0x3Af19B02cD319985E1e012399F319114d5e56E1</span>
              </div>
            </div>

            {/* Recent On-Chain Earmarks */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Live On-Chain Deposits
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>

              <div className="space-y-2.5">
                {(recentList.length > 0 ? recentList : [
                  {
                    id: "DON-901",
                    donor: "0x71C9...b901",
                    amount: "50.00 ETH",
                    amountUsd: "$160,000",
                    amountInr: "₹1,34,64,000",
                    rail: "CRYPTO",
                    token: "ETH",
                    purpose: "Water Infrastructure - Wardha Cluster",
                    txHash: "0x8a9f2c11d4e8b00192f3a1c55e67d89012b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7",
                    status: "LOCKED_IN_ESCROW",
                    timestamp: "2026-10-24 10:15:00 UTC",
                    block: 20491823,
                  },
                  {
                    id: "DON-902",
                    donor: "priya.sharma@okaxis",
                    amount: "₹25,000",
                    amountUsd: "$297.08",
                    amountInr: "₹25,000",
                    rail: "UPI",
                    token: "INR",
                    purpose: "Water Infrastructure - Wardha Cluster",
                    txHash: "0x44b912aaccdd00112233445566778899aabbccddeeff00112233445566778899",
                    status: "LOCKED_IN_ESCROW",
                    timestamp: "2026-10-25 08:30:00 UTC",
                    block: 20491839,
                  }
                ]).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{item.amount}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{item.purpose}</div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
                      <span>Tx: <span className="text-indigo-300">{item.txHash.slice(0, 10)}…</span></span>
                      <span>{item.timestamp.slice(11, 16)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* ╔════════════════════════════════════════════════════════════╗
            ║  POST-DONATION CRYPTOGRAPHIC ESCROW RECEIPT MODAL          ║
            ╚════════════════════════════════════════════════════════════╝ */}
        {receiptData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
            <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-100">
                      Escrow Deposit Confirmed On-Chain
                    </h2>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Block #{receiptData.blockNumber} · {receiptData.timestamp}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setReceiptData(null)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              {/* Deposit Certificate Card */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Deposited Amount:</span>
                  <span className="text-base font-bold text-slate-100">
                    {receiptData.amountDeposited} {receiptData.token} (≈ ${receiptData.equivalentUsd} USD)
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Earmarked Purpose:</span>
                  <span className="text-indigo-300 font-bold">{receiptData.purposeBound.purposeName}</span>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">On-Chain Tx Hash:</span>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-indigo-300 break-all text-[11px]">
                    <span>{receiptData.txHash}</span>
                    <button
                      onClick={() => handleCopy(receiptData.txHash)}
                      className="ml-2 p-1 text-slate-400 hover:text-white shrink-0"
                    >
                      {copiedTx === receiptData.txHash ? "✓" : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Keccak256 Purpose Commitment:</span>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-400 break-all text-[11px]">
                    {receiptData.purposeBound.keccak256Commitment}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] leading-relaxed">
                  🛡️ <strong>Escrow Guarantee:</strong> 100% of these funds are sealed in <code className="text-white">PurposeBoundEscrow.sol</code>. They can only be released upon receipt OCR + pixel ELA forensic pass.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/flow-tracer"
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>🌐 Trace in DAG</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/dashboard"
                  className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                >
                  <span>🏛️ View Escrow Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
