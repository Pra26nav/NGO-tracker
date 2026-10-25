/**
 * Utilities for Silent API Fallback, Demo Mode (?demo=safe),
 * and High-Fidelity Forensic Visual Assets.
 */

export function isDemoSafeMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("demo") === "safe";
  } catch {
    return false;
  }
}

/**
 * Robust fetch wrapper that enforces timeout, catches network errors silently,
 * and immediately triggers local fallback if ?demo=safe is active.
 */
export async function safeFetchJson<T>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 2500
): Promise<{ ok: boolean; data: T | null; isDemoSafe: boolean }> {
  if (isDemoSafeMode()) {
    return { ok: false, data: null, isDemoSafe: true };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { ok: true, data, isDemoSafe: false };
    }
    return { ok: false, data: null, isDemoSafe: false };
  } catch {
    // Silently fall back to cached local data without throwing
    return { ok: false, data: null, isDemoSafe: false };
  }
}

/**
 * Base64 or SVG Data URIs for realistic Forensic ELA Heatmaps & Receipt Previews
 */
export const FORGED_ELA_HEATMAP_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 480 220">
  <defs>
    <radialGradient id="heatHot" cx="62%" cy="48%" r="35%">
      <stop offset="0%" stop-color="#ff0055" stop-opacity="0.95" />
      <stop offset="35%" stop-color="#ff7700" stop-opacity="0.85" />
      <stop offset="70%" stop-color="#ffff00" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#1e1035" stop-opacity="0" />
    </radialGradient>
    <pattern id="noise" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="#080816" />
      <circle cx="1" cy="2" r="0.75" fill="#1b1c3d" />
      <circle cx="4" cy="5" r="0.85" fill="#2d1b4e" />
      <circle cx="5" cy="1" r="0.6" fill="#18233c" />
    </pattern>
  </defs>
  <!-- Background forensic noise -->
  <rect width="480" height="220" fill="url(#noise)" />
  
  <!-- Subtle invoice layout lines (faint compression residual) -->
  <line x1="40" y1="35" x2="440" y2="35" stroke="#252b48" stroke-width="1.5" stroke-dasharray="2,4" />
  <line x1="40" y1="55" x2="220" y2="55" stroke="#252b48" stroke-width="1.5" />
  <line x1="40" y1="75" x2="180" y2="75" stroke="#252b48" stroke-width="1" />
  <line x1="40" y1="105" x2="440" y2="105" stroke="#1f2340" stroke-width="1" />
  <line x1="40" y1="130" x2="440" y2="130" stroke="#1f2340" stroke-width="1" />
  <line x1="40" y1="155" x2="440" y2="155" stroke="#1f2340" stroke-width="1" />
  
  <!-- Splicing / Alteration Anomaly Heatmap Patch -->
  <rect x="250" y="80" width="170" height="65" rx="8" fill="url(#heatHot)" />
  <rect x="265" y="90" width="140" height="45" fill="none" stroke="#ff0055" stroke-width="1.5" stroke-dasharray="4,2" />
  
  <!-- Forensic bounding box labels -->
  <text x="270" y="82" fill="#ff4466" font-family="monospace" font-size="10" font-weight="bold">🚨 ELA PEAK: 38.7 / 50.0</text>
  <text x="270" y="118" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold">₹45,000 [SPLICED]</text>
  <text x="270" y="130" fill="#ffcc00" font-family="monospace" font-size="8">JPEG Q=85 RESAVE DIFFERENTIAL</text>
  
  <!-- Normal low compression residuals elsewhere -->
  <circle cx="90" cy="118" r="8" fill="#00ffff" opacity="0.18" />
  <circle cx="150" cy="118" r="12" fill="#00ffff" opacity="0.12" />
  <circle cx="80" cy="142" r="10" fill="#00ffff" opacity="0.15" />
  
  <!-- Grid overlay -->
  <line x1="0" y1="110" x2="480" y2="110" stroke="#00ffff" stroke-width="0.5" stroke-opacity="0.15" />
  <line x1="240" y1="0" x2="240" y2="220" stroke="#00ffff" stroke-width="0.5" stroke-opacity="0.15" />
  
  <text x="14" y="205" fill="#64748b" font-family="monospace" font-size="9">FORENSIC ELA HEATMAP · HAMMING DISTANCE=2 · CLONE CONFIRMED</text>
</svg>
`)}`;

export const CLEAN_ELA_HEATMAP_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="220" viewBox="0 0 480 220">
  <defs>
    <pattern id="cleanNoise" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="#080816" />
      <circle cx="1" cy="2" r="0.6" fill="#0f172a" />
      <circle cx="4" cy="5" r="0.7" fill="#131e36" />
      <circle cx="5" cy="1" r="0.5" fill="#0c1324" />
    </pattern>
  </defs>
  <rect width="480" height="220" fill="url(#cleanNoise)" />
  <line x1="40" y1="35" x2="440" y2="35" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="2,4" />
  <line x1="40" y1="70" x2="300" y2="70" stroke="#1e293b" stroke-width="1" />
  <line x1="40" y1="105" x2="440" y2="105" stroke="#1e293b" stroke-width="1" />
  <line x1="40" y1="140" x2="440" y2="140" stroke="#1e293b" stroke-width="1" />
  
  <!-- Uniform authentic compression speckle -->
  <rect x="40" y="85" width="400" height="80" rx="6" fill="#10b981" fill-opacity="0.04" stroke="#10b981" stroke-width="0.75" stroke-dasharray="3,3" />
  <text x="50" y="100" fill="#10b981" font-family="monospace" font-size="10" font-weight="bold">✓ UNIFORM COMPRESSION PASS (SCORE: 4.2 / 50.0)</text>
  <text x="50" y="125" fill="#94a3b8" font-family="monospace" font-size="11">Authentic original scan · Zero pixel splicing detected</text>
  <text x="50" y="145" fill="#64748b" font-family="monospace" font-size="9">keccak256 Semantic Nullifier verified in on-chain registry</text>
  
  <text x="14" y="205" fill="#10b981" font-family="monospace" font-size="9">✓ ELA PASS · ZERO SPLICING · UNIQUE PERCEPTUAL SIGNATURE</text>
</svg>
`)}`;

/**
 * Generate a styled receipt thumbnail SVG Data URI
 */
export function generateReceiptThumbnailSvg(
  invoiceNo: string,
  vendor: string,
  amount: string,
  badgeText: string,
  isForged: boolean = false
): string {
  const accentColor = isForged ? "#ef4444" : "#10b981";
  const badgeBg = isForged ? "#450a0a" : "#064e3b";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="190" viewBox="0 0 300 190">
  <defs>
    <linearGradient id="paperGrad_${invoiceNo.replace(/[^a-zA-Z0-9]/g, "")}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
  </defs>
  <!-- Card Background -->
  <rect x="2" y="2" width="296" height="186" rx="10" fill="url(#paperGrad_${invoiceNo.replace(/[^a-zA-Z0-9]/g, "")})" stroke="${accentColor}" stroke-width="1.2" stroke-opacity="0.6" />
  
  <!-- Header Bar -->
  <rect x="12" y="12" width="276" height="28" rx="6" fill="#1e293b" fill-opacity="0.7" />
  <circle cx="24" cy="26" r="4" fill="${accentColor}" />
  <text x="34" y="30" fill="#f8fafc" font-family="sans-serif" font-size="11" font-weight="bold">${invoiceNo}</text>
  
  <!-- Status Badge -->
  <rect x="200" y="16" width="80" height="20" rx="4" fill="${badgeBg}" stroke="${accentColor}" stroke-width="0.8" />
  <text x="240" y="30" text-anchor="middle" fill="${accentColor}" font-family="sans-serif" font-size="9" font-weight="bold">${badgeText}</text>
  
  <!-- Vendor & Item Lines -->
  <text x="14" y="60" fill="#94a3b8" font-family="sans-serif" font-size="9" font-weight="600">CERTIFIED VENDOR:</text>
  <text x="14" y="75" fill="#e2e8f0" font-family="sans-serif" font-size="11" font-weight="bold">${vendor.length > 34 ? vendor.slice(0, 32) + "…" : vendor}</text>
  
  <!-- Amount Highlight Box -->
  <rect x="12" y="90" width="276" height="42" rx="6" fill="#090d16" stroke="#334155" stroke-width="0.8" />
  <text x="22" y="106" fill="#64748b" font-family="monospace" font-size="8">VERIFIED EXPENDITURE AMOUNT</text>
  <text x="22" y="124" fill="${accentColor}" font-family="monospace" font-size="14" font-weight="bold">${amount}</text>
  
  <!-- Footer Barcode & Verification Seal -->
  <line x1="14" y1="146" x2="286" y2="146" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
  
  <!-- Barcode simulation -->
  <g fill="#475569">
    <rect x="14" y="156" width="2" height="18" />
    <rect x="18" y="156" width="3" height="18" />
    <rect x="23" y="156" width="1" height="18" />
    <rect x="26" y="156" width="4" height="18" />
    <rect x="32" y="156" width="2" height="18" />
    <rect x="36" y="156" width="3" height="18" />
    <rect x="41" y="156" width="1" height="18" />
    <rect x="44" y="156" width="4" height="18" />
    <rect x="50" y="156" width="2" height="18" />
    <rect x="54" y="156" width="3" height="18" />
    <rect x="59" y="156" width="2" height="18" />
    <rect x="63" y="156" width="1" height="18" />
  </g>
  <text x="75" y="168" fill="#64748b" font-family="monospace" font-size="8">NULLIFIER SEALED ON-CHAIN</text>
  <text x="286" y="168" text-anchor="end" fill="${accentColor}" font-family="monospace" font-size="8" font-weight="bold">
    ${isForged ? "🚨 TAMPERED" : "✓ VERIFIED"}
  </text>
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
