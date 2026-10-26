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
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="280" viewBox="0 0 640 280">
  <defs>
    <!-- Thermal Anomaly Spectrum Gradient -->
    <radialGradient id="thermalCore" cx="68%" cy="46%" r="28%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="15%" stop-color="#ffff00" stop-opacity="0.95" />
      <stop offset="38%" stop-color="#ff3300" stop-opacity="0.9" />
      <stop offset="65%" stop-color="#cc0066" stop-opacity="0.75" />
      <stop offset="85%" stop-color="#4d0080" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#0a0d18" stop-opacity="0" />
    </radialGradient>

    <!-- Technical Forensic Cross-Hatch Grid -->
    <pattern id="forensicGrid" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#080b12" />
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#141a29" stroke-width="0.75" />
      <circle cx="8" cy="8" r="0.6" fill="#222b40" />
    </pattern>

    <!-- High-Frequency Residual Compression Noise -->
    <pattern id="pixelResiduals" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="none" />
      <rect x="0" y="0" width="1.2" height="1.2" fill="#1b2438" opacity="0.6" />
      <rect x="2" y="2" width="1.2" height="1.2" fill="#2d3752" opacity="0.4" />
    </pattern>
  </defs>

  <!-- Base Technical Dark Grid -->
  <rect width="640" height="280" fill="url(#forensicGrid)" />
  <rect width="640" height="280" fill="url(#pixelResiduals)" />

  <!-- Ghosted Document Structure (8x8 DCT Compression Blocks) -->
  <g stroke="#1b243b" stroke-width="1" stroke-dasharray="2,4" opacity="0.7">
    <rect x="30" y="25" width="580" height="225" fill="none" />
    <line x1="30" y1="65" x2="610" y2="65" />
    <line x1="30" y1="105" x2="610" y2="105" />
    <line x1="30" y1="180" x2="610" y2="180" />
    <!-- Vertical Column Alignments -->
    <line x1="220" y1="65" x2="220" y2="180" />
    <line x1="420" y1="65" x2="420" y2="180" />
  </g>

  <!-- Ghosted Legitimate Invoice Text Residuals (Low Energy / Baseline < 8.0dB) -->
  <g fill="#2d3a58" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="600">
    <text x="45" y="48">VENDOR: NAGPUR HYDRO PIPES PVT LTD</text>
    <text x="420" y="48">INV-2026-8841 · 2026-10-24</text>
    <text x="45" y="90">GSTIN: 27AAACW1234F1Z5</text>
    <text x="45" y="130">ITEM: 1x HDPE 5000L STORAGE TANK</text>
    <text x="45" y="155">BASE RESIDUAL: 4.8 dB [UNIFORM ENTHROPY]</text>
  </g>

  <!-- ── ANOMALY ZONE: SPLICED AMOUNT INSERTION ── -->
  <!-- False-color intense ELA anomaly bloom -->
  <rect x="340" y="85" width="240" height="85" rx="4" fill="url(#thermalCore)" />

  <!-- High-Precision Reticle / Crosshair Target -->
  <g stroke="#ff0055" stroke-width="1.5">
    <!-- Outer Target Brackets -->
    <path d="M 360 95 L 345 95 L 345 110" fill="none" />
    <path d="M 555 95 L 570 95 L 570 110" fill="none" />
    <path d="M 345 145 L 345 160 L 360 160" fill="none" />
    <path d="M 570 145 L 570 160 L 555 160" fill="none" />
    <!-- Bounding Box Dash -->
    <rect x="355" y="100" width="205" height="50" fill="none" stroke="#ffff00" stroke-width="1.2" stroke-dasharray="4,2" />
  </g>

  <!-- Reticle Center Crosshair -->
  <g stroke="#ffffff" stroke-width="1" opacity="0.9">
    <line x1="457" y1="92" x2="457" y2="158" />
    <line x1="410" y1="125" x2="505" y2="125" />
    <circle cx="457" cy="125" r="14" fill="none" stroke="#ffff00" stroke-width="1" />
  </g>

  <!-- Spliced Target Text & Digital Artifact Label -->
  <text x="365" y="122" fill="#000000" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="900" letter-spacing="1">₹45,000</text>
  <text x="364" y="121" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="900" letter-spacing="1">₹45,000</text>

  <!-- Callout Flags & Forensic Data -->
  <rect x="355" y="72" width="180" height="18" fill="#171e19" stroke="#ff0055" stroke-width="1" />
  <text x="362" y="85" fill="#ff4466" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="bold">TARGET ROI: SPLICED DIGIT [45,000]</text>

  <rect x="355" y="155" width="205" height="18" fill="#171e19" stroke="#ffff00" stroke-width="1" />
  <text x="362" y="167" fill="#ffff00" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="bold">Q=85 RESAVE ERROR: +38.7 dB PEAK</text>

  <!-- Coordinate Readout HUD -->
  <g fill="#64748b" font-family="'JetBrains Mono', monospace" font-size="9">
    <text x="45" y="205">OPTICAL KERNEL: JPEG 8x8 DCT DIFFERENTIAL · ERROR LEVEL ANALYSIS (ELA)</text>
    <text x="45" y="222">ROI COORDINATES: [X: 355..560, Y: 100..150] · CONFIDENCE: 99.98%</text>
    <text x="45" y="239">DIAGNOSTIC: FORGED DIGIT "4" SPLICED OVER ORIGINAL "1" · Q-TABLE MISMATCH</text>
  </g>

  <!-- Calibration Thermal Spectrum Scale (Bottom Strip) -->
  <g transform="translate(30, 258)">
    <text x="0" y="10" fill="#94a3b8" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="bold">0.0 dB (BASE)</text>
    <defs>
      <linearGradient id="spectrumScale" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="30%" stop-color="#3b82f6" />
        <stop offset="50%" stop-color="#10b981" />
        <stop offset="70%" stop-color="#f59e0b" />
        <stop offset="90%" stop-color="#ef4444" />
        <stop offset="100%" stop-color="#ffffff" />
      </linearGradient>
    </defs>
    <rect x="85" y="2" width="410" height="10" rx="2" fill="url(#spectrumScale)" stroke="#000000" stroke-width="1" />
    <line x1="290" y1="0" x2="290" y2="14" stroke="#ffffff" stroke-width="1.5" />
    <text x="250" y="-3" fill="#ff5964" font-family="'JetBrains Mono', monospace" font-size="7.5" font-weight="bold">THRESHOLD: 15.0 dB</text>
    <text x="505" y="10" fill="#ff0055" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="bold">50.0 dB (PEAK)</text>
  </g>
</svg>
`)}`;

export const CLEAN_ELA_HEATMAP_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="280" viewBox="0 0 640 280">
  <defs>
    <pattern id="cleanGrid" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#080b12" />
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#131d2e" stroke-width="0.75" />
      <circle cx="8" cy="8" r="0.6" fill="#1b283d" />
    </pattern>
    <pattern id="cleanNoiseSpeckle" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="none" />
      <rect x="0" y="0" width="1" height="1" fill="#0f2b24" opacity="0.7" />
      <rect x="2" y="2" width="1" height="1" fill="#143d32" opacity="0.5" />
    </pattern>
  </defs>

  <rect width="640" height="280" fill="url(#cleanGrid)" />
  <rect width="640" height="280" fill="url(#cleanNoiseSpeckle)" />

  <!-- Ghosted Document Structure -->
  <g stroke="#1b332b" stroke-width="1" stroke-dasharray="2,4" opacity="0.6">
    <rect x="30" y="25" width="580" height="225" fill="none" />
    <line x1="30" y1="65" x2="610" y2="65" />
    <line x1="30" y1="105" x2="610" y2="105" />
    <line x1="30" y1="180" x2="610" y2="180" />
  </g>

  <!-- Document Meta & Verified Entropy -->
  <g fill="#477366" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="600">
    <text x="45" y="48">VENDOR: MAHARASHTRA BOREWELL &amp; PVC SUPPLY CO.</text>
    <text x="420" y="48">INV-2026-9001 · 2026-10-25</text>
    <text x="45" y="90">GSTIN: 27WATER9988Z</text>
    <text x="45" y="130">ITEM: 3x SUBMERSIBLE BOREWELL PUMPS &amp; 200mm PVC</text>
    <text x="45" y="155">TOTAL VERIFIED: ₹1,20,000 INR (0.48 ETH eq.)</text>
  </g>

  <!-- Uniform Authenticity Overlay -->
  <rect x="30" y="65" width="580" height="115" fill="#10b981" fill-opacity="0.04" stroke="#10b981" stroke-width="0.8" stroke-dasharray="4,4" />
  
  <rect x="360" y="105" width="220" height="42" fill="#0b241e" stroke="#10b981" stroke-width="1.2" />
  <text x="372" y="123" fill="#10b981" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold">UNIFORM COMPRESSION PASS</text>
  <text x="372" y="137" fill="#6ee7b7" font-family="'JetBrains Mono', monospace" font-size="8.5">ELA NOISE DELTA: 4.2 dB (&lt;= 15.0 dB)</text>

  <!-- Diagnostic Logs -->
  <g fill="#477366" font-family="'JetBrains Mono', monospace" font-size="9">
    <text x="45" y="205">OPTICAL KERNEL: JPEG 8x8 DCT DIFFERENTIAL · ERROR LEVEL ANALYSIS (ELA)</text>
    <text x="45" y="222">HOMOGENEITY VERDICT: 100% UNIFORM QUANTIZATION · ZERO SPLICED ARTIFACTS</text>
    <text x="45" y="239">CRYPTOGRAPHIC PROOF: keccak256 NULLIFIER MATCHES 50 ETH WATER INFRASTRUCTURE</text>
  </g>

  <!-- Calibration Thermal Spectrum Scale -->
  <g transform="translate(30, 258)">
    <text x="0" y="10" fill="#477366" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="bold">0.0 dB (BASE)</text>
    <rect x="85" y="2" width="410" height="10" rx="2" fill="#10b981" fill-opacity="0.3" stroke="#10b981" stroke-width="1" />
    <line x1="120" y1="0" x2="120" y2="14" stroke="#10b981" stroke-width="2" />
    <text x="130" y="9" fill="#10b981" font-family="'JetBrains Mono', monospace" font-size="7.5" font-weight="bold">CURRENT PEAK: 4.2 dB (PASS)</text>
    <text x="505" y="10" fill="#477366" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="bold">50.0 dB (MAX)</text>
  </g>
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
    ${isForged ? "[TAMPERED]" : "[VERIFIED]"}
  </text>
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
