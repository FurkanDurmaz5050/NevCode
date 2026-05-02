export type BusinessInput = {
  website?: string;
  instagram?: string;
  idea?: string;
  category?: string;
  productName?: string;
  unitCostTRY?: number;
  leadTimeDays?: number;
  weightKg?: number;
};

export type MarketRecommendation = {
  country: string;
  flag: string;
  marketplaces: string[];
  fitScore: number;
  estDemand: string;
  competition: "Düşük" | "Orta" | "Yüksek";
  avgMargin: number;
  shippingMode: "Hava" | "Kara" | "Deniz" | "Demiryolu";
  shippingDays: number;
  shippingCostPerKg: number;
  carbonKgPerKg: number;
  taxNote: string;
};

export type FxForecast = {
  pair: string;
  current: number;
  predicted: number;
  series: { d: string; v: number }[];
  marginProtection: number;
};

export type VideoBrief = {
  id: string;
  market: string;
  language: string;
  duration: number;
  hook: string;
  cta: string;
  status: "queued" | "rendering" | "ready";
  progress: number;
};

const MARKET_DB: Omit<MarketRecommendation, "fitScore">[] = [
  { country: "Almanya", flag: "🇩🇪", marketplaces: ["Otto", "Amazon.de", "Kaufland"], estDemand: "Yüksek", competition: "Yüksek", avgMargin: 34, shippingMode: "Kara", shippingDays: 6, shippingCostPerKg: 2.4, carbonKgPerKg: 0.18, taxNote: "EORI + KDV (%19)" },
  { country: "Hollanda", flag: "🇳🇱", marketplaces: ["Bol.com", "Amazon.nl"], estDemand: "Yüksek", competition: "Orta", avgMargin: 38, shippingMode: "Deniz", shippingDays: 14, shippingCostPerKg: 0.41, carbonKgPerKg: 0.02, taxNote: "EORI + KDV (%21)" },
  { country: "BAE", flag: "🇦🇪", marketplaces: ["Noon", "Amazon.ae"], estDemand: "Orta", competition: "Düşük", avgMargin: 42, shippingMode: "Hava", shippingDays: 3, shippingCostPerKg: 4.8, carbonKgPerKg: 0.82, taxNote: "VAT %5, ithalat %5" },
  { country: "Japonya", flag: "🇯🇵", marketplaces: ["Rakuten", "Amazon.co.jp"], estDemand: "Orta", competition: "Yüksek", avgMargin: 29, shippingMode: "Deniz", shippingDays: 28, shippingCostPerKg: 0.55, carbonKgPerKg: 0.03, taxNote: "Tüketim vergisi %10" },
  { country: "İngiltere", flag: "🇬🇧", marketplaces: ["Amazon.co.uk", "eBay UK"], estDemand: "Yüksek", competition: "Yüksek", avgMargin: 31, shippingMode: "Kara", shippingDays: 7, shippingCostPerKg: 2.6, carbonKgPerKg: 0.19, taxNote: "VAT %20, post-Brexit" },
  { country: "Suudi Arabistan", flag: "🇸🇦", marketplaces: ["Noon SA", "Salla"], estDemand: "Orta", competition: "Düşük", avgMargin: 45, shippingMode: "Hava", shippingDays: 4, shippingCostPerKg: 4.2, carbonKgPerKg: 0.78, taxNote: "VAT %15" },
  { country: "İsveç", flag: "🇸🇪", marketplaces: ["Amazon.se", "CDON"], estDemand: "Orta", competition: "Düşük", avgMargin: 36, shippingMode: "Demiryolu", shippingDays: 12, shippingCostPerKg: 0.9, carbonKgPerKg: 0.04, taxNote: "KDV %25" },
  { country: "ABD", flag: "🇺🇸", marketplaces: ["Amazon.com", "Etsy", "Walmart"], estDemand: "Yüksek", competition: "Yüksek", avgMargin: 33, shippingMode: "Deniz", shippingDays: 32, shippingCostPerKg: 0.8, carbonKgPerKg: 0.04, taxNote: "Eyalet bazlı sales tax" },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function analyzeBusiness(input: BusinessInput): MarketRecommendation[] {
  const seed = hash((input.website || "") + (input.instagram || "") + (input.idea || "") + (input.category || ""));
  const cat = (input.category || "").toLowerCase();

  return MARKET_DB.map((m, i) => {
    let score = 60 + ((seed + i * 17) % 35);
    if (cat.includes("kozmetik") && ["BAE", "Suudi Arabistan", "Almanya"].includes(m.country)) score += 8;
    if (cat.includes("tekstil") && ["Almanya", "Hollanda", "İngiltere"].includes(m.country)) score += 6;
    if (cat.includes("gıda") && ["Almanya", "İngiltere", "ABD"].includes(m.country)) score += 7;
    if (cat.includes("el yapımı") && ["ABD", "İngiltere", "Japonya"].includes(m.country)) score += 9;
    score = Math.min(99, score);
    return { ...m, fitScore: score };
  }).sort((a, b) => b.fitScore - a.fitScore);
}

export function forecastFx(pair: string, days: number): FxForecast {
  const base = pair === "EUR/TRY" ? 32.1 : pair === "USD/TRY" ? 29.8 : 41.2;
  const seed = hash(pair);
  const series = Array.from({ length: days }, (_, i) => {
    const drift = i * 0.06;
    const noise = ((seed + i * 13) % 20) / 100;
    return { d: `G${i + 1}`, v: +(base + drift + noise).toFixed(2) };
  });
  const predicted = series[series.length - 1].v;
  const marginProtection = +(((predicted - base) / base) * 100).toFixed(1);
  return { pair, current: base, predicted, series, marginProtection };
}

export function calculateShipping(weightKg: number, m: MarketRecommendation) {
  const cost = +(weightKg * m.shippingCostPerKg).toFixed(2);
  const co2 = +(weightKg * m.carbonKgPerKg).toFixed(2);
  return { cost, co2, days: m.shippingDays, mode: m.shippingMode };
}

export function generateVideoBriefs(input: BusinessInput, markets: MarketRecommendation[]): VideoBrief[] {
  const langMap: Record<string, string> = {
    "Almanya": "DE", "Hollanda": "NL", "BAE": "AR", "Japonya": "JA",
    "İngiltere": "EN", "Suudi Arabistan": "AR", "İsveç": "SV", "ABD": "EN",
  };
  const product = input.productName || input.category || "ürününüz";
  return markets.slice(0, 4).map((m, i) => ({
    id: `vid_${i}_${Date.now()}`,
    market: m.country,
    language: langMap[m.country] || "EN",
    duration: 15 + (i % 3) * 15,
    hook: `${m.country} pazarı için: ${product} ile tanışın`,
    cta: `Şimdi ${m.marketplaces[0]} üzerinde keşfet`,
    status: "queued",
    progress: 0,
  }));
}
