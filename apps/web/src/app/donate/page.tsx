"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLedger } from "@/context/ledger-context";
import { useWeb3 } from "@/context/web3-provider";
import {
  HeartHandshake,
  QrCode,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Package,
  Boxes,
  Stethoscope,
  Clock,
  ArrowRight,
  Check,
  Coins,
  RefreshCw,
  Sparkles,
  Download,
  X,
  FileCheck2,
} from "lucide-react";

type ActiveTab = "CAPITAL" | "GOODS" | "SERVICES";
type CurrencyType = "INR" | "USD" | "EUR" | "GBP";

interface CurrencyConfig {
  code: CurrencyType;
  symbol: string;
  name: string;
  presets: number[];
  defaultAmount: number;
  rateToUsd: number;
  gatewayName: string;
  gatewayBadge: string;
  gatewayAccountLabel: string;
  gatewayAccountValue: string;
  payerPlaceholder: string;
  simulateBtnText: (amt: number) => string;
}

const CURRENCY_CONFIGS: Record<CurrencyType, CurrencyConfig> = {
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    presets: [1000, 5000, 25000, 100000],
    defaultAmount: 25000,
    rateToUsd: 1 / 84.15,
    gatewayName: "INSTANT FIAT UPI GATEWAY",
    gatewayBadge: "Zero KYC Under ₹50K",
    gatewayAccountLabel: "UPI VPA Earmark:",
    gatewayAccountValue: "ngo.water.escrow@icici",
    payerPlaceholder: "donor.wallet@okaxis",
    simulateBtnText: (amt) => `SIMULATE INSTANT UPI PAYMENT (₹${amt.toLocaleString("en-IN")})`,
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    presets: [25, 50, 100, 500, 2500],
    defaultAmount: 100,
    rateToUsd: 1.0,
    gatewayName: "INSTANT STRIPE / ACH GATEWAY",
    gatewayBadge: "Instant Settlement",
    gatewayAccountLabel: "Stripe Escrow Earmark:",
    gatewayAccountValue: "stripe.ngo.water.escrow@us",
    payerPlaceholder: "donor.card@gmail.com",
    simulateBtnText: (amt) => `SIMULATE STRIPE PAYMENT ($${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    presets: [25, 50, 100, 500, 2500],
    defaultAmount: 100,
    rateToUsd: 1.08,
    gatewayName: "INSTANT SEPA / CARD GATEWAY",
    gatewayBadge: "SEPA Instant Protocol",
    gatewayAccountLabel: "IBAN Escrow Routing:",
    gatewayAccountValue: "DE89 3704 0044 0532 0130 00",
    payerPlaceholder: "donor.sepa@bank.eu",
    simulateBtnText: (amt) => `SIMULATE SEPA PAYMENT (€${amt.toLocaleString("en-EU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    presets: [20, 50, 100, 500, 2000],
    defaultAmount: 100,
    rateToUsd: 1.28,
    gatewayName: "UK FASTER PAYMENTS GATEWAY",
    gatewayBadge: "FCA Regulated Rails",
    gatewayAccountLabel: "Sort Code / Account:",
    gatewayAccountValue: "Sort: 20-04-15 | Acc: 83920194",
    payerPlaceholder: "donor.bacs@bank.co.uk",
    simulateBtnText: (amt) => `SIMULATE FASTER PAYMENT (£${amt.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
  },
};

interface DonationReceipt {
  id: string;
  type: "CRYPTO" | "UPI" | "GOODS" | "SERVICES";
  amountDisplay: string;
  secondaryAmountDisplay: string;
  purpose: string;
  txHash: string;
  timestamp: string;
  taxReceiptId: string;
  tranches: { name: string; pct: number; amount: string }[];
}

export default function DonatePage() {
  const ledger = useLedger();
  const web3 = useWeb3();

  const [activeTab, setActiveTab] = useState<ActiveTab>("CAPITAL");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>("INR");

  // Crypto form
  const [cryptoAmount, setCryptoAmount] = useState<string>("5.0");
  const [isLocking, setIsLocking] = useState<boolean>(false);

  // Fiat form
  const [fiatAmount, setFiatAmount] = useState<number>(25000);
  const [upiPayer, setUpiPayer] = useState<string>("donor.wallet@okaxis");

  // User donations history & active receipt modal
  const [userContributions, setUserContributions] = useState<DonationReceipt[]>([]);
  const [activeReceipt, setActiveReceipt] = useState<DonationReceipt | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Currency switcher handler
  const handleSelectCurrency = (curr: CurrencyType) => {
    setSelectedCurrency(curr);
    setFiatAmount(CURRENCY_CONFIGS[curr].defaultAmount);
    setUpiPayer(CURRENCY_CONFIGS[curr].payerPlaceholder);
  };

  // Live conversion calculations for the current input
  const activeCurrencyConfig = CURRENCY_CONFIGS[selectedCurrency];
  const liveUsdValue = fiatAmount * activeCurrencyConfig.rateToUsd;
  const liveInrValue = liveUsdValue * 84.15;
  const liveEthValue = liveUsdValue / 3200;
  const liveUsdcValue = liveUsdValue;

  // In-Kind Goods State
  const [inventory, setInventory] = useState([
    { id: "MED-01", name: "Emergency Surgical Triage Kits", type: "MEDICAL", pledged: 150, received: 150, distributed: 120, remaining: 30, unit: "kits" },
    { id: "PUMP-02", name: "Solar Submersible Borewell Pumps (5HP)", type: "GOODS", pledged: 40, received: 40, distributed: 32, remaining: 8, unit: "units" },
    { id: "FOOD-03", name: "Fortified Nutrition Grain Sacks (50kg)", type: "FOOD", pledged: 500, received: 500, distributed: 450, remaining: 50, unit: "sacks" },
  ]);

  // Volunteer Services State
  const [volunteerHours, setVolunteerHours] = useState([
    { id: "VOL-01", name: "Dr. Sunita Rao (MD)", spec: "Medical", task: "Fluorosis Screening Camp", hours: 48, valInr: 240000 },
    { id: "VOL-02", name: "Er. Pradeep Patil (Civil)", spec: "Engineering", task: "Aquifer Hydro-Testing", hours: 36, valInr: 180000 },
    { id: "VOL-03", name: "Adv. Rajesh Deshmukh", spec: "Legal", task: "Panchayat Water Rights MoU", hours: 24, valInr: 120000 },
  ]);

  // Total session contribution calculator
  const totalEthDonated = userContributions.reduce((sum, item) => {
    if (item.type === "CRYPTO") {
      const val = parseFloat(item.amountDisplay.replace(/[^0-9.]/g, "")) || 0;
      return sum + val;
    }
    return sum;
  }, 0);

  const totalFiatDonatedUsd = userContributions.reduce((sum, item) => {
    if (item.type === "UPI") {
      const match = item.secondaryAmountDisplay.match(/~\$([0-9,.]+)/);
      if (match) {
        return sum + (parseFloat(match[1].replace(/,/g, "")) || 0);
      }
    }
    return sum;
  }, 0);

  const handleLockCrypto = async () => {
    setIsLocking(true);
    const amt = parseFloat(cryptoAmount) || 1.0;
    const usdVal = amt * 3200;
    const inrVal = usdVal * 84.15;
    const txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const taxId = `80G-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await fetch("http://127.0.0.1:8000/api/dashboard/release-next-tranche", { method: "GET" }).catch(() => {});
      ledger.addDonation({
        amount: amt,
        rail: "CRYPTO",
        token: "ETH",
        purposeName: "Water Infrastructure",
        donorName: web3?.address || "Web3 Contributor",
      });
    } catch {
      ledger.addDonation({
        amount: amt,
        rail: "CRYPTO",
        token: "ETH",
        purposeName: "Water Infrastructure",
        donorName: web3?.address || "Web3 Contributor",
      });
    } finally {
      setIsLocking(false);
      const receipt: DonationReceipt = {
        id: `TX-${Date.now()}`,
        type: "CRYPTO",
        amountDisplay: `${amt.toFixed(2)} ETH`,
        secondaryAmountDisplay: `$${usdVal.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD · ₹${inrVal.toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR`,
        purpose: "Water Infrastructure (Maharashtra Rural Borewells)",
        txHash,
        timestamp: new Date().toLocaleTimeString(),
        taxReceiptId: taxId,
        tranches: [
          { name: "Tranche 1 (20%): Hydro Geological Survey", pct: 20, amount: `${(amt * 0.20).toFixed(2)} ETH` },
          { name: "Tranche 2 (30%): Borewell Drilling & PVC Casing", pct: 30, amount: `${(amt * 0.30).toFixed(2)} ETH` },
          { name: "Tranche 3 (30%): 5HP Solar Submersible Pumps", pct: 30, amount: `${(amt * 0.30).toFixed(2)} ETH` },
          { name: "Tranche 4 (20%): Grampanchayat Commissioning", pct: 20, amount: `${(amt * 0.20).toFixed(2)} ETH` },
        ],
      };
      setUserContributions((prev) => [receipt, ...prev]);
      setActiveReceipt(receipt);
    }
  };

  const handleSimulateFiat = () => {
    const config = CURRENCY_CONFIGS[selectedCurrency];
    const rawAmt = fiatAmount;
    const usdVal = rawAmt * config.rateToUsd;
    const inrVal = usdVal * 84.15;
    const ethEq = usdVal / 3200;
    const refId = `${selectedCurrency}-${Math.floor(100000000 + Math.random() * 900000000)}`;
    const taxId = `80G-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const addedTx = ledger.addDonation({
      amount: rawAmt,
      rail: "UPI",
      token: selectedCurrency,
      purposeName: "Water Infrastructure",
      donorName: upiPayer || `Donor (${selectedCurrency})`,
      utrNumber: refId,
    });

    const isInt = selectedCurrency === "INR";
    const receipt: DonationReceipt = {
      id: `${selectedCurrency}-${Date.now()}`,
      type: "UPI",
      amountDisplay: `${config.symbol}${rawAmt.toLocaleString(isInt ? "en-IN" : "en-US", { minimumFractionDigits: isInt ? 0 : 2, maximumFractionDigits: isInt ? 0 : 2 })} ${selectedCurrency}`,
      secondaryAmountDisplay: `~$${usdVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD · ₹${inrVal.toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR · ${ethEq.toFixed(4)} ETH eq.`,
      purpose: "Water Infrastructure (Instant Fiat Escrow Mint)",
      txHash: addedTx?.txHash || refId,
      timestamp: new Date().toLocaleTimeString(),
      taxReceiptId: taxId,
      tranches: [
        { name: "Tranche 1 (20%): Hydro Geological Survey", pct: 20, amount: `${config.symbol}${(rawAmt * 0.20).toLocaleString(isInt ? "en-IN" : "en-US", { minimumFractionDigits: isInt ? 0 : 2, maximumFractionDigits: isInt ? 0 : 2 })}` },
        { name: "Tranche 2 (30%): Borewell Drilling & PVC Casing", pct: 30, amount: `${config.symbol}${(rawAmt * 0.30).toLocaleString(isInt ? "en-IN" : "en-US", { minimumFractionDigits: isInt ? 0 : 2, maximumFractionDigits: isInt ? 0 : 2 })}` },
        { name: "Tranche 3 (30%): 5HP Solar Submersible Pumps", pct: 30, amount: `${config.symbol}${(rawAmt * 0.30).toLocaleString(isInt ? "en-IN" : "en-US", { minimumFractionDigits: isInt ? 0 : 2, maximumFractionDigits: isInt ? 0 : 2 })}` },
        { name: "Tranche 4 (20%): Grampanchayat Commissioning", pct: 20, amount: `${config.symbol}${(rawAmt * 0.20).toLocaleString(isInt ? "en-IN" : "en-US", { minimumFractionDigits: isInt ? 0 : 2, maximumFractionDigits: isInt ? 0 : 2 })}` },
      ],
    };

    setUserContributions((prev) => [receipt, ...prev]);
    setActiveReceipt(receipt);
  };

  const handlePledgeGoods = (item: typeof inventory[0]) => {
    const pledgeAmt = 10;
    const txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const taxId = `80G-GOODS-${Math.floor(100000 + Math.random() * 900000)}`;

    setInventory((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, pledged: i.pledged + pledgeAmt, remaining: i.remaining + pledgeAmt } : i))
    );

    ledger.addDonation({
      amount: pledgeAmt,
      rail: "IN_KIND_LOGISTICS",
      token: item.unit.toUpperCase(),
      purposeName: `Physical Relief: ${item.name}`,
      donorName: "Supply Chain Partner",
      contributionType: item.type as any,
      itemName: item.name,
      quantity: pledgeAmt,
      unit: item.unit,
    });

    const receipt: DonationReceipt = {
      id: `GOODS-${Date.now()}`,
      type: "GOODS",
      amountDisplay: `${pledgeAmt} ${item.unit}`,
      secondaryAmountDisplay: `${item.name} (${item.type})`,
      purpose: "Physical Relief Warehouse Ingestion",
      txHash,
      timestamp: new Date().toLocaleTimeString(),
      taxReceiptId: taxId,
      tranches: [
        { name: "Warehouse Intake & QC Audit", pct: 50, amount: `${pledgeAmt / 2} ${item.unit}` },
        { name: "Field Distribution to Rameshwar Ward 4", pct: 50, amount: `${pledgeAmt / 2} ${item.unit}` },
      ],
    };

    setUserContributions((prev) => [receipt, ...prev]);
    setActiveReceipt(receipt);
  };

  const handlePledgeVolunteers = (vol: typeof volunteerHours[0]) => {
    const hoursPledged = 8;
    const txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const taxId = `PROBONO-${Math.floor(100000 + Math.random() * 900000)}`;

    setVolunteerHours((prev) =>
      prev.map((v) => (v.id === vol.id ? { ...v, hours: v.hours + hoursPledged, valInr: v.valInr + 40000 } : v))
    );

    ledger.addDonation({
      amount: hoursPledged,
      rail: "VOLUNTEER_SERVICE",
      token: "HOURS",
      purposeName: vol.task,
      donorName: vol.name,
      contributionType: "VOLUNTEER_SERVICE",
      volunteerCategory: vol.spec as any,
      hours: hoursPledged,
    });

    const receipt: DonationReceipt = {
      id: `VOL-${Date.now()}`,
      type: "SERVICES",
      amountDisplay: `${hoursPledged} Pro-Bono Hours`,
      secondaryAmountDisplay: `Valued at ₹40,000 INR (~$475 USD economic impact)`,
      purpose: `${vol.name} — ${vol.task}`,
      txHash,
      timestamp: new Date().toLocaleTimeString(),
      taxReceiptId: taxId,
      tranches: [
        { name: "Field Mission Sessions (4h)", pct: 50, amount: "4 Hours" },
        { name: "Panchayat Verification Sign-off (4h)", pct: 50, amount: "4 Hours" },
      ],
    };

    setUserContributions((prev) => [receipt, ...prev]);
    setActiveReceipt(receipt);
  };

  return (
    <div className="w-full bg-dot-pattern min-h-screen text-black pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 bg-white border-2 border-black px-3.5 py-1.5 rounded-lg shadow-brutal-sm w-fit">
            <span className="w-2.5 h-2.5 rounded-full bg-primary border border-black" />
            <span className="font-heading font-black text-xs uppercase tracking-tight">
              MULTI-RAIL INGESTION // CRYPTO • FIAT UPI • IN-KIND GOODS • VOLUNTEERS
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter text-black">
              DONATE &amp; MOBILIZE
            </h1>
            <p className="font-mono text-xs sm:text-sm text-black/70 max-w-xl">
              Lock capital into purpose-bound smart contract escrows or track in-kind physical supplies with cryptographic custody manifests.
            </p>
          </div>
        </div>

        {/* ── USER'S CUMULATIVE CONTRIBUTION BANNER (SHOWN WHEN DONATED) ── */}
        {userContributions.length > 0 && (
          <div className="card-brutal-yellow p-6 rounded-2xl flex flex-col gap-4 border-2 border-black shadow-brutal animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-charcoal text-primary flex items-center justify-center font-heading font-black text-sm border-2 border-black">
                  ✓
                </span>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/70">
                    Active Contributor Session
                  </div>
                  <h2 className="font-heading font-black text-2xl uppercase tracking-tight text-black">
                    YOUR VERIFIED CONTRIBUTIONS SUMMARY
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-white border-2 border-black font-mono font-black text-xs px-3 py-1 rounded-lg shadow-brutal-sm">
                  {userContributions.length} CONTRIBUTION{userContributions.length > 1 ? "S" : ""} LOCKED
                </span>
                <button
                  onClick={() => setActiveReceipt(userContributions[0])}
                  className="btn-brutal bg-charcoal text-white hover:bg-black font-heading font-black text-xs px-3.5 py-1 rounded-lg uppercase tracking-tight"
                >
                  VIEW LATEST RECEIPT
                </button>
              </div>
            </div>

            {/* Contribution Stats Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border-2 border-black p-4 rounded-xl shadow-brutal-sm">
                <span className="text-[10px] font-mono font-bold uppercase text-black/60">Total Donated by You (ETH)</span>
                <div className="font-heading font-black text-3xl text-black mt-1">
                  {totalEthDonated > 0 ? `${totalEthDonated.toFixed(2)} ETH` : "0.00 ETH"}
                </div>
                <div className="text-[11px] font-mono text-black/70 mt-0.5">
                  ${(totalEthDonated * 3200).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD Locked in Escrow
                </div>
              </div>

              <div className="bg-white border-2 border-black p-4 rounded-xl shadow-brutal-sm">
                <span className="text-[10px] font-mono font-bold uppercase text-black/60">Total Fiat Donated by You</span>
                <div className="font-heading font-black text-3xl text-black mt-1">
                  ${totalFiatDonatedUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] font-mono text-black/70 mt-0.5">
                  ~₹{(totalFiatDonatedUsd * 84.15).toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR Minted Directly
                </div>
              </div>

              <div className="bg-white border-2 border-black p-4 rounded-xl shadow-brutal-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-black/60">Escrow Security Guarantee</span>
                  <div className="font-heading font-black text-base text-brutal-green uppercase mt-1">
                    100% PURPOSE-BOUND
                  </div>
                  <div className="text-[11px] font-mono text-black/70">
                    Funds release only upon verified OCR + pHash + ZK proofs
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  <Link
                    href={userContributions.length > 0 ? `/flow-tracer?tx=${encodeURIComponent(userContributions[0].txHash)}` : "/flow-tracer"}
                    className="btn-brutal bg-primary hover:bg-yellow-400 text-black font-heading font-black text-[10px] px-2.5 py-1 rounded border border-black uppercase tracking-tight flex items-center gap-1"
                  >
                    <span>TRACE IN FLOW DAG</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="btn-brutal bg-white hover:bg-sage text-black font-heading font-black text-[10px] px-2.5 py-1 rounded border border-black uppercase tracking-tight flex items-center gap-1"
                  >
                    <span>INSPECT VAULT</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LIVE FOREX & CRYPTO ORACLE CONVERSION RATES BAR (SYSTEM ORACLE) ── */}
        <div className="card-brutal bg-white p-3.5 sm:p-4 rounded-xl border-2 border-black flex flex-wrap items-center justify-between gap-3 shadow-brutal-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-black" />
            <span className="font-heading font-black text-xs uppercase tracking-tight text-black">
              LIVE CURRENCY CONVERSION ORACLE RATES:
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold flex-wrap">
            <button
              onClick={() => handleSelectCurrency("INR")}
              className={`border-2 border-black px-2.5 py-1 rounded transition-all cursor-pointer ${selectedCurrency === "INR" ? "bg-primary font-black shadow-brutal-sm scale-105" : "bg-primary/20 text-black hover:bg-primary/40"}`}
              title="Click to select INR"
            >
              RBI USD/INR: <span className="font-black">₹84.15</span>
            </button>
            <button
              onClick={() => handleSelectCurrency("USD")}
              className={`border-2 border-black px-2.5 py-1 rounded transition-all cursor-pointer ${selectedCurrency === "USD" ? "bg-primary font-black shadow-brutal-sm scale-105" : "bg-primary/20 text-black hover:bg-primary/40"}`}
              title="Click to select USD"
            >
              USDC: <span className="font-black">$1.0001</span>
            </button>
            <button
              onClick={() => handleSelectCurrency("EUR")}
              className={`border-2 border-black px-2.5 py-1 rounded transition-all cursor-pointer ${selectedCurrency === "EUR" ? "bg-primary font-black shadow-brutal-sm scale-105" : "bg-primary/20 text-black hover:bg-primary/40"}`}
              title="Click to select EUR"
            >
              EUR/USD: <span className="font-black">$1.0800</span> <span className="text-[10px] text-black/60">(₹90.88)</span>
            </button>
            <button
              onClick={() => handleSelectCurrency("GBP")}
              className={`border-2 border-black px-2.5 py-1 rounded transition-all cursor-pointer ${selectedCurrency === "GBP" ? "bg-primary font-black shadow-brutal-sm scale-105" : "bg-primary/20 text-black hover:bg-primary/40"}`}
              title="Click to select GBP"
            >
              GBP/USD: <span className="font-black">$1.2800</span> <span className="text-[10px] text-black/60">(₹107.71)</span>
            </button>
            <div className="bg-sage border-2 border-black px-2.5 py-1 rounded text-black">
              ETH: <span className="font-black">$3,200.00</span>
            </div>
          </div>
        </div>

        {/* ── 3 Main Tab Buttons with Brutalist Spacing ───────── */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            onClick={() => setActiveTab("CAPITAL")}
            className={`btn-brutal text-xs sm:text-sm font-heading font-black px-5 py-3 rounded-xl uppercase tracking-tight flex items-center gap-2 ${
              activeTab === "CAPITAL"
                ? "bg-charcoal text-white"
                : "bg-white text-black hover:bg-sage"
            }`}
          >
            <Coins className="w-4 h-4 text-primary" />
            <span>1. CAPITAL DONATIONS (CRYPTO &amp; UPI)</span>
          </button>

          <button
            onClick={() => setActiveTab("GOODS")}
            className={`btn-brutal text-xs sm:text-sm font-heading font-black px-5 py-3 rounded-xl uppercase tracking-tight flex items-center gap-2 ${
              activeTab === "GOODS"
                ? "bg-charcoal text-white"
                : "bg-white text-black hover:bg-sage"
            }`}
          >
            <Boxes className="w-4 h-4 text-primary" />
            <span>2. IN-KIND GOODS &amp; RELIEF SUPPLIES</span>
          </button>

          <button
            onClick={() => setActiveTab("SERVICES")}
            className={`btn-brutal text-xs sm:text-sm font-heading font-black px-5 py-3 rounded-xl uppercase tracking-tight flex items-center gap-2 ${
              activeTab === "SERVICES"
                ? "bg-charcoal text-white"
                : "bg-white text-black hover:bg-sage"
            }`}
          >
            <Stethoscope className="w-4 h-4 text-primary" />
            <span>3. PRO-BONO PROFESSIONAL SERVICES</span>
          </button>
        </div>

        {/* ── TAB 1: CAPITAL DONATIONS (CRYPTO & UPI) ───────────── */}
        {activeTab === "CAPITAL" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Web3 Crypto Escrow Locker (6 cols) */}
            <div className="lg:col-span-6 card-brutal p-6 rounded-2xl flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-5 h-5 text-black" />
                  <h3 className="font-heading font-black text-xl text-black uppercase">
                    WEB3 CRYPTO ESCROW LOCKER
                  </h3>
                </div>
                <span className="bg-sage text-black font-mono font-bold text-xs px-2.5 py-0.5 rounded border border-black">
                  Base Sepolia
                </span>
              </div>

              <p className="font-body text-xs text-black/80">
                Capital is committed directly to <code className="font-bold">PurposeBoundEscrow.sol</code>. Funds cannot leave without verified nullifiers matching the Keccak earmark.
              </p>

              {/* Token Selector & Presets */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-mono font-bold text-black/70 uppercase">
                  Select Token &amp; Amount:
                </label>
                <div className="flex items-center gap-2">
                  {["1", "5", "10", "50"].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setCryptoAmount(preset)}
                      className={`btn-brutal text-xs font-mono font-bold px-3 py-1.5 rounded-lg flex-1 ${
                        cryptoAmount === preset ? "bg-primary text-black" : "bg-white text-black"
                      }`}
                    >
                      {preset} ETH
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="number"
                    value={cryptoAmount}
                    onChange={(e) => setCryptoAmount(e.target.value)}
                    step="0.1"
                    min="0.1"
                    className="flex-1 px-3.5 py-2.5 rounded-lg border-2 border-black font-mono text-sm font-bold bg-white focus:outline-none"
                  />
                  <span className="bg-charcoal text-white font-heading font-black text-xs px-4 py-2.5 rounded-lg border-2 border-black">
                    ETH
                  </span>
                </div>
              </div>

              {/* Purpose Earmark Commitment Preview */}
              <div className="bg-primary/20 border-2 border-black rounded-xl p-3.5 flex flex-col gap-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-black/60 font-bold uppercase">Purpose Earmark:</span>
                  <span className="font-black text-black">Water Infrastructure</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-black/60 font-bold uppercase">Keccak Commitment:</span>
                  <span className="font-extrabold text-black truncate max-w-xs">0x4f8a91b2c3d4e5f6...</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-black/60 font-bold uppercase">Tranche Structure:</span>
                  <span className="font-extrabold text-black">4 Milestones (20/30/30/20)</span>
                </div>
              </div>

              {/* Lock Button */}
              <button
                onClick={handleLockCrypto}
                disabled={isLocking}
                className="btn-brutal bg-charcoal hover:bg-black text-white font-heading font-black text-sm py-3.5 rounded-xl uppercase tracking-tight flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>{isLocking ? "LOCKING IN ESCROW..." : `COMMIT & LOCK ${cryptoAmount} ETH`}</span>
              </button>
            </div>

            {/* Right: Instant Fiat Banking Gateway (6 cols) */}
            <div className="lg:col-span-6 card-brutal p-6 rounded-2xl flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-5 h-5 text-black" />
                  <h3 className="font-heading font-black text-xl text-black uppercase">
                    {activeCurrencyConfig.gatewayName}
                  </h3>
                </div>
                <span className="bg-primary text-black font-mono font-bold text-xs px-2.5 py-0.5 rounded border border-black">
                  {activeCurrencyConfig.gatewayBadge}
                </span>
              </div>

              <p className="font-body text-xs text-black/80">
                Direct settlement in {activeCurrencyConfig.name}. Capital is automatically normalized to USDC.e and minted into the purpose-bound escrow smart contract.
              </p>

              {/* Currency Selector Tabs */}
              <div className="flex flex-col gap-1.5">
                <div className="text-[11px] font-mono font-bold text-black/70 uppercase">
                  Select Donation Currency:
                </div>
                <div className="flex items-center gap-2">
                  {(["INR", "USD", "EUR", "GBP"] as CurrencyType[]).map((curr) => {
                    const isSelected = selectedCurrency === curr;
                    return (
                      <button
                        key={curr}
                        onClick={() => handleSelectCurrency(curr)}
                        className={`btn-brutal text-xs font-mono font-bold px-3 py-2 rounded-lg flex-1 transition-all ${
                          isSelected
                            ? "bg-charcoal text-white shadow-brutal-sm scale-[1.02]"
                            : "bg-white text-black hover:bg-sage"
                        }`}
                      >
                        <span className="font-black mr-1">{CURRENCY_CONFIGS[curr].symbol}</span>
                        <span>{curr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Presets for Selected Currency */}
              <div className="flex flex-col gap-1.5">
                <div className="text-[11px] font-mono font-bold text-black/70 uppercase">
                  Quick Amount Presets ({selectedCurrency}):
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {activeCurrencyConfig.presets.map((val) => {
                    const isSelected = fiatAmount === val;
                    const displayPreset = selectedCurrency === "INR"
                      ? (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)
                      : `${activeCurrencyConfig.symbol}${val >= 1000 ? `${val / 1000}k` : val}`;
                    return (
                      <button
                        key={val}
                        onClick={() => setFiatAmount(val)}
                        className={`btn-brutal text-xs font-mono font-bold py-2 rounded-lg transition-all ${
                          isSelected ? "bg-primary text-black font-black shadow-brutal-sm" : "bg-white text-black hover:bg-sage"
                        }`}
                      >
                        {displayPreset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Amount Numeric Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono font-bold text-black/70 uppercase">
                  Custom Amount ({activeCurrencyConfig.name}):
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-base text-black/70">
                      {activeCurrencyConfig.symbol}
                    </span>
                    <input
                      type="number"
                      min="1"
                      step={selectedCurrency === "INR" ? "500" : "5"}
                      value={fiatAmount || ""}
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value);
                        setFiatAmount(isNaN(parsed) ? 0 : Math.max(0, parsed));
                      }}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border-2 border-black font-mono text-base font-bold bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-brutal-sm"
                      placeholder={`Enter amount in ${selectedCurrency}`}
                    />
                  </div>
                  <span className="bg-charcoal text-white font-heading font-black text-xs px-4 py-3 rounded-lg border-2 border-black">
                    {selectedCurrency}
                  </span>
                </div>
              </div>

              {/* Real-time Dynamic Currency Conversion Card */}
              <div className="bg-sage/25 border-2 border-black rounded-xl p-3.5 flex flex-col gap-2 font-mono text-xs shadow-brutal-sm">
                <div className="flex items-center justify-between pb-1.5 border-b border-black/20">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-black" />
                    <span className="text-[10px] uppercase font-bold text-black/70">
                      Live Currency Conversion Matrix:
                    </span>
                  </div>
                  <span className="font-extrabold text-black bg-primary px-2 py-0.5 rounded border border-black text-[10px]">
                    REAL-TIME SYNC
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-0.5">
                  <div className="bg-white border border-black p-2 rounded">
                    <div className="text-[9px] text-black/60 font-bold uppercase">USD Equiv</div>
                    <div className="font-black text-black text-xs sm:text-sm truncate">
                      ${liveUsdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white border border-black p-2 rounded">
                    <div className="text-[9px] text-black/60 font-bold uppercase">INR Equiv</div>
                    <div className="font-black text-black text-xs sm:text-sm truncate">
                      ₹{liveInrValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="bg-white border border-black p-2 rounded">
                    <div className="text-[9px] text-black/60 font-bold uppercase">Escrow Mint</div>
                    <div className="font-black text-black text-xs sm:text-sm truncate">
                      {liveUsdcValue.toFixed(2)} USDC.e
                    </div>
                  </div>
                  <div className="bg-white border border-black p-2 rounded">
                    <div className="text-[9px] text-black/60 font-bold uppercase">ETH Equiv</div>
                    <div className="font-black text-black text-xs sm:text-sm truncate">
                      {liveEthValue.toFixed(4)} ETH
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Gateway Mockup with QR Code & Real-time Currency Conversion */}
              <div className="border-2 border-black rounded-xl p-4 sm:p-5 bg-white flex flex-col sm:flex-row items-center gap-5 shadow-brutal-sm">
                
                {/* QR Code Graphic with Selected Currency Stamp */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="relative w-32 h-32 bg-primary/15 border-2 border-black rounded-xl p-2.5 flex flex-col items-center justify-center shadow-inner">
                    <div className="relative flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-black" />
                      {/* Center Currency Symbol Badge */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-8 h-8 rounded-full bg-primary border-2 border-black flex items-center justify-center font-heading font-black text-sm text-black shadow-brutal-xs">
                          {activeCurrencyConfig.symbol}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-black text-[10px] uppercase text-black bg-primary px-2.5 py-0.5 rounded border border-black shadow-brutal-xs">
                    SCAN TO PAY {selectedCurrency}
                  </span>
                </div>

                {/* Details Displayed Besides the QR Code */}
                <div className="flex flex-col gap-2 font-mono text-xs w-full">
                  
                  {/* Selected Currency Badge */}
                  <div className="flex items-center justify-between pb-1.5 border-b-2 border-black flex-wrap gap-1">
                    <span className="text-[10px] uppercase font-bold text-black/60">
                      Selected Currency:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-black bg-primary px-2.5 py-0.5 rounded border-2 border-black shadow-brutal-xs">
                        {selectedCurrency} ({activeCurrencyConfig.symbol}) — {activeCurrencyConfig.name}
                      </span>
                    </div>
                  </div>

                  {/* Destination Gateway Account / VPA */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-black/60">
                      {activeCurrencyConfig.gatewayAccountLabel}
                    </span>
                    <div className="font-bold text-black bg-neutral-100 p-1.5 rounded border border-black truncate text-xs select-all">
                      {activeCurrencyConfig.gatewayAccountValue}
                    </div>
                  </div>

                  {/* Selected Amount Displayed in Selected Currency */}
                  <div className="flex items-center justify-between py-1 border-t border-b border-black/15">
                    <span className="text-[11px] uppercase font-bold text-black/70">
                      Amount:
                    </span>
                    <strong className="text-black font-extrabold text-sm sm:text-base">
                      {activeCurrencyConfig.symbol}{fiatAmount.toLocaleString(selectedCurrency === "INR" ? "en-IN" : "en-US", {
                        minimumFractionDigits: selectedCurrency === "INR" ? 0 : 2,
                        maximumFractionDigits: selectedCurrency === "INR" ? 0 : 2,
                      })} {selectedCurrency}
                    </strong>
                  </div>

                  {/* Live Conversion of Currency Rates */}
                  <div className="flex items-center justify-between text-[11px] text-black/85 flex-wrap gap-1">
                    <span className="font-bold text-black/60 uppercase text-[10px]">
                      Conversion Rate:
                    </span>
                    <span className="font-bold text-black bg-sage px-2 py-0.5 rounded border border-black text-[11px]">
                      {selectedCurrency === "INR" && "1 USD = ₹84.15 INR (1 INR ≈ $0.0119 USD)"}
                      {selectedCurrency === "USD" && "1 USD = $1.0000 USD (≈ ₹84.15 INR)"}
                      {selectedCurrency === "EUR" && "1 EUR = $1.0800 USD (≈ ₹90.88 INR)"}
                      {selectedCurrency === "GBP" && "1 GBP = $1.2800 USD (≈ ₹107.71 INR)"}
                    </span>
                  </div>

                  {/* Auto-converts to USDC.e line (Preserving Exact Image Spec) */}
                  <div className="flex items-center justify-between text-[11px] bg-primary/20 p-1.5 rounded border border-black">
                    <span className="font-bold text-black/80 uppercase text-[10px]">
                      Auto-converts to:
                    </span>
                    <strong className="font-extrabold text-black text-xs">
                      ~{liveUsdcValue.toFixed(2)} USDC.e
                    </strong>
                  </div>

                  {/* Secondary Currency Equivalents */}
                  <div className="flex items-center justify-between text-[10px] text-black/70 pt-0.5 flex-wrap gap-1">
                    <span>
                      {selectedCurrency === "INR" ? (
                        <span>Equivalent: <strong>${liveUsdValue.toFixed(2)} USD</strong></span>
                      ) : (
                        <span>Equivalent: <strong>₹{liveInrValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR</strong></span>
                      )}
                    </span>
                    <span className="text-[10px] text-black/60">
                      Escrow: ~{liveEthValue.toFixed(4)} ETH (@ $3,200 benchmark)
                    </span>
                  </div>

                </div>
              </div>

              {/* Simulate Gateway Payment Confirm Button */}
              <button
                onClick={handleSimulateFiat}
                disabled={fiatAmount <= 0}
                className="btn-brutal bg-charcoal hover:bg-black text-white font-heading font-black text-xs py-3.5 rounded-xl uppercase tracking-tight flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{activeCurrencyConfig.simulateBtnText(fiatAmount)}</span>
              </button>
            </div>

          </div>
        )}

        {/* ── TAB 2: IN-KIND GOODS & SUPPLIES ──────────────────── */}
        {activeTab === "GOODS" && (
          <div className="card-brutal p-6 rounded-2xl flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2.5">
                <Package className="w-6 h-6 text-black" />
                <div>
                  <h3 className="font-heading font-black text-2xl uppercase tracking-tight text-black">
                    IN-KIND GOODS &amp; RELIEF SUPPLIES LEDGER
                  </h3>
                  <p className="font-mono text-xs text-black/60">
                    Track non-cash physical equipment manifests with on-chain warehouse custody handoffs.
                  </p>
                </div>
              </div>

              <span className="bg-sage text-black font-mono font-bold text-xs px-3 py-1 rounded border border-black">
                Warehouse: Wardha Central Storage
              </span>
            </div>

            {/* Goods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {inventory.map((item) => (
                <div key={item.id} className="border-2 border-black rounded-xl p-5 bg-white flex flex-col justify-between gap-4 shadow-brutal-sm">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="bg-charcoal text-white px-2 py-0.5 rounded border border-black">{item.id}</span>
                      <span className="bg-sage text-black px-2 py-0.5 rounded border border-black">{item.type}</span>
                    </div>

                    <h4 className="font-heading font-black text-lg text-black uppercase leading-tight pt-1">
                      {item.name}
                    </h4>
                  </div>

                  {/* Quantity Bars */}
                  <div className="flex flex-col gap-1.5 font-mono text-xs">
                    <div className="flex justify-between text-black/70">
                      <span>Pledged: <strong>{item.pledged} {item.unit}</strong></span>
                      <span>Distributed: <strong className="text-brutal-green">{item.distributed}</strong></span>
                    </div>
                    <div className="flex justify-between text-black/70">
                      <span>Warehouse Balance:</span>
                      <strong className="text-black bg-primary px-1.5 rounded border border-black">{item.remaining} {item.unit}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePledgeGoods(item)}
                    className="btn-brutal bg-white hover:bg-sage text-black font-heading font-black text-[11px] py-2.5 rounded-lg uppercase tracking-tight flex items-center justify-center gap-1.5"
                  >
                    <span>+ PLEDGE 10 {item.unit.toUpperCase()}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: PRO-BONO PROFESSIONAL SERVICES ────────────── */}
        {activeTab === "SERVICES" && (
          <div className="card-brutal p-6 rounded-2xl flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-6 h-6 text-black" />
                <div>
                  <h3 className="font-heading font-black text-2xl uppercase tracking-tight text-black">
                    PRO-BONO PROFESSIONAL SERVICES LEDGER
                  </h3>
                  <p className="font-mono text-xs text-black/60">
                    Log voluntary hours in Medical, Civil Engineering, and Legal fields with institutional economic impact valuation.
                  </p>
                </div>
              </div>

              <div className="bg-primary border-2 border-black px-3 py-1 rounded text-xs font-mono font-extrabold">
                108.0 TOTAL HOURS LOGGED
              </div>
            </div>

            {/* Volunteer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {volunteerHours.map((vol) => (
                <div key={vol.id} className="border-2 border-black rounded-xl p-5 bg-white flex flex-col justify-between gap-4 shadow-brutal-sm">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="bg-charcoal text-white px-2 py-0.5 rounded border border-black">{vol.id}</span>
                      <span className="bg-sage text-black px-2 py-0.5 rounded border border-black">{vol.spec}</span>
                    </div>

                    <h4 className="font-heading font-black text-lg text-black uppercase pt-1">
                      {vol.name}
                    </h4>
                    <p className="font-body text-xs text-black/80">{vol.task}</p>
                  </div>

                  <div className="border-t-2 border-black pt-3 flex items-center justify-between font-mono text-xs">
                    <div>
                      <div className="text-[10px] text-black/60">Contributed Hours:</div>
                      <div className="font-heading font-black text-base">{vol.hours} hrs</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-black/60">Valuation (INR):</div>
                      <div className="font-heading font-black text-base text-brutal-green">₹{vol.valInr.toLocaleString()}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePledgeVolunteers(vol)}
                    className="btn-brutal bg-white hover:bg-sage text-black font-heading font-black text-[11px] py-2.5 rounded-lg uppercase tracking-tight flex items-center justify-center gap-1.5"
                  >
                    <span>+ PLEDGE 8 PRO-BONO HOURS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DONATION CONFIRMED POPUP MODAL (DISPLAYS EXACT AMOUNT DONATED) ── */}
        {activeReceipt && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card-brutal-yellow max-w-xl w-full p-6 sm:p-8 rounded-2xl flex flex-col gap-6 border-2 border-black shadow-brutal-lg relative animate-in zoom-in-95 duration-200">
              
              {/* Close Button */}
              <button
                onClick={() => setActiveReceipt(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center hover:bg-sage shadow-brutal-sm text-black"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Badge */}
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 bg-charcoal text-white border-2 border-black px-3 py-1 rounded-md text-xs font-mono font-bold w-fit">
                  <CheckCircle2 className="w-4 h-4 text-brutal-green" />
                  <span>ON-CHAIN DONATION AUDIT CONFIRMED</span>
                </div>

                <div className="text-xs font-mono font-bold text-black/70 uppercase">
                  Verified Contribution Amount:
                </div>
                
                {/* Big Display of the Amount Donated */}
                <div className="font-heading font-black text-4xl sm:text-5xl text-black uppercase tracking-tight">
                  {activeReceipt.amountDisplay}
                </div>

                <div className="text-sm font-mono font-bold text-black/80">
                  {activeReceipt.secondaryAmountDisplay}
                </div>
              </div>

              {/* Receipt Details Box */}
              <div className="bg-white border-2 border-black rounded-xl p-4 flex flex-col gap-2.5 font-mono text-xs shadow-brutal-sm">
                <div className="flex justify-between items-center pb-2 border-b border-black/20">
                  <span className="text-black/60 font-bold uppercase">Purpose Earmark:</span>
                  <span className="font-extrabold text-black">{activeReceipt.purpose}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-black/20">
                  <span className="text-black/60 font-bold uppercase">80G Tax Exemption Ref:</span>
                  <span className="font-extrabold text-black bg-primary px-2 py-0.5 rounded border border-black">
                    {activeReceipt.taxReceiptId}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-black/20">
                  <span className="text-black/60 font-bold uppercase">Transaction / UTR Hash:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-black truncate max-w-[180px] sm:max-w-xs">
                      {activeReceipt.txHash}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeReceipt.txHash);
                        setCopiedHash(true);
                        setTimeout(() => setCopiedHash(false), 2000);
                      }}
                      className="p-1 rounded bg-sage hover:bg-white border border-black"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3 text-black" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-black/60 font-bold uppercase">Timestamp:</span>
                  <span className="font-bold text-black">{activeReceipt.timestamp}</span>
                </div>
              </div>

              {/* Tranche Allocation Breakdown */}
              <div className="flex flex-col gap-2">
                <div className="text-xs font-mono font-bold uppercase text-black/70">
                  Deterministic Tranche Release Schedule:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeReceipt.tranches.map((t, idx) => (
                    <div key={idx} className="bg-white border-2 border-black rounded-lg p-2.5 flex items-center justify-between text-xs font-mono shadow-brutal-sm">
                      <span className="text-black/70 truncate mr-2">{t.name}:</span>
                      <strong className="text-black font-extrabold shrink-0">{t.amount}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="btn-brutal bg-white hover:bg-sage text-black font-heading font-black text-xs px-5 py-3 rounded-xl uppercase tracking-tight flex-1"
                >
                  CLOSE RECEIPT
                </button>
                <Link
                  href={`/flow-tracer?tx=${encodeURIComponent(activeReceipt.txHash)}`}
                  onClick={() => setActiveReceipt(null)}
                  className="btn-brutal bg-charcoal hover:bg-black text-white font-heading font-black text-xs px-5 py-3 rounded-xl uppercase tracking-tight flex items-center justify-center gap-2 flex-1"
                >
                  <span>TRACE IN FLOW PIPELINE</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
