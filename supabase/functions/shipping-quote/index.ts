// supabase/functions/shipping-quote
// Shippo API (token varsa gerçek), yoksa deterministik tahmin.
// Mod bazında (Hava/Kara/Deniz/Demiryolu) hesaplama.

import { corsHeaders, handleOptions } from "../_shared/cors.ts";

const SHIPPO_TOKEN = Deno.env.get("SHIPPO_TOKEN");

interface Req {
  from_country?: string; // default "TR"
  to_country: string;
  weight_kg: number;
  pieces?: number;
}

// Mode bazında temel parametreler (Türkiye → Avrupa/MENA referansı)
const MODE_DEFAULTS = {
  Hava:        { base: 4.5, perKg: 4.8, days: 3,  co2PerKgKm: 0.0006 },
  Kara:        { base: 1.2, perKg: 2.4, days: 6,  co2PerKgKm: 0.00012 },
  Deniz:       { base: 0.5, perKg: 0.45, days: 14, co2PerKgKm: 0.000015 },
  Demiryolu:   { base: 0.8, perKg: 0.9, days: 12, co2PerKgKm: 0.000028 },
} as const;

// Ülke başkenti / büyük şehir koordinatları (lat, lng).
// Mesafe haversine ile hesaplanır → harita ve karbonla tutarlı.
const COUNTRY_COORDS: Record<string, { lat: number; lng: number; city: string }> = {
  TR: { lat: 41.0082, lng: 28.9784, city: "Istanbul" },
  DE: { lat: 52.5200, lng: 13.4050, city: "Berlin" },
  NL: { lat: 52.3676, lng: 4.9041,  city: "Amsterdam" },
  GB: { lat: 51.5074, lng: -0.1278, city: "London" },
  FR: { lat: 48.8566, lng: 2.3522,  city: "Paris" },
  IT: { lat: 41.9028, lng: 12.4964, city: "Rome" },
  ES: { lat: 40.4168, lng: -3.7038, city: "Madrid" },
  SE: { lat: 59.3293, lng: 18.0686, city: "Stockholm" },
  PL: { lat: 52.2297, lng: 21.0122, city: "Warsaw" },
  AT: { lat: 48.2082, lng: 16.3738, city: "Vienna" },
  CH: { lat: 47.3769, lng: 8.5417,  city: "Zurich" },
  BE: { lat: 50.8503, lng: 4.3517,  city: "Brussels" },
  RO: { lat: 44.4268, lng: 26.1025, city: "Bucharest" },
  GR: { lat: 37.9838, lng: 23.7275, city: "Athens" },
  RU: { lat: 55.7558, lng: 37.6173, city: "Moscow" },
  AE: { lat: 25.2048, lng: 55.2708, city: "Dubai" },
  SA: { lat: 24.7136, lng: 46.6753, city: "Riyadh" },
  QA: { lat: 25.2854, lng: 51.5310, city: "Doha" },
  KW: { lat: 29.3759, lng: 47.9774, city: "Kuwait City" },
  EG: { lat: 30.0444, lng: 31.2357, city: "Cairo" },
  IL: { lat: 32.0853, lng: 34.7818, city: "Tel Aviv" },
  US: { lat: 40.7128, lng: -74.0060, city: "New York" },
  CA: { lat: 43.6532, lng: -79.3832, city: "Toronto" },
  MX: { lat: 19.4326, lng: -99.1332, city: "Mexico City" },
  BR: { lat: -23.5505, lng: -46.6333, city: "São Paulo" },
  JP: { lat: 35.6762, lng: 139.6503, city: "Tokyo" },
  KR: { lat: 37.5665, lng: 126.9780, city: "Seoul" },
  CN: { lat: 31.2304, lng: 121.4737, city: "Shanghai" },
  IN: { lat: 28.6139, lng: 77.2090, city: "New Delhi" },
  AU: { lat: -33.8688, lng: 151.2093, city: "Sydney" },
  ZA: { lat: -26.2041, lng: 28.0473, city: "Johannesburg" },
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return json({ error: "POST gerekli" }, 405);

  let body: Req;
  try { body = await req.json(); } catch { return json({ error: "Geçersiz JSON" }, 400); }
  if (!body.to_country || !body.weight_kg) return json({ error: "to_country ve weight_kg zorunlu" }, 400);

  const totalKg = body.weight_kg * (body.pieces ?? 1);
  const fromCC = (body.from_country ?? "TR").toUpperCase();
  const toCC = body.to_country.toUpperCase();
  const fromCoord = COUNTRY_COORDS[fromCC] ?? COUNTRY_COORDS.TR;
  const toCoord = COUNTRY_COORDS[toCC];
  const distKm = toCoord ? haversineKm(fromCoord, toCoord) : 2500;

  // Shippo varsa: yalnızca Hava (DHL/UPS) için gerçek fiyat al, diğer modlar tahmini kal.
  let shippoRate: { amount: number; currency: string; provider: string; days?: number } | null = null;
  if (SHIPPO_TOKEN) {
    try {
      shippoRate = await fetchShippo(body.to_country, totalKg);
    } catch { /* fallback */ }
  }

  const quotes = (Object.keys(MODE_DEFAULTS) as (keyof typeof MODE_DEFAULTS)[]).map((mode) => {
    const cfg = MODE_DEFAULTS[mode];
    let cost = +(cfg.base + cfg.perKg * totalKg).toFixed(2);
    let provider = `Estimate (${mode})`;
    let days = cfg.days + Math.round(distKm / 2500);

    if (mode === "Hava" && shippoRate) {
      cost = +shippoRate.amount.toFixed(2);
      provider = shippoRate.provider;
      if (shippoRate.days) days = shippoRate.days;
    }

    const co2_kg = +(cfg.co2PerKgKm * totalKg * distKm).toFixed(3);

    return {
      mode,
      provider,
      currency: "EUR",
      cost_eur: cost,
      cost_per_kg: +(cost / totalKg).toFixed(2),
      transit_days: days,
      co2_kg,
      distance_km: distKm,
    };
  });

  // Önerilen: en düşük (cost + co2*5) skorlu
  const recommended = [...quotes].sort(
    (a, b) => (a.cost_eur + a.co2_kg * 5) - (b.cost_eur + b.co2_kg * 5),
  )[0].mode;

  return json({
    from_country: fromCC,
    to_country: toCC,
    from_coords: fromCoord ? { lat: fromCoord.lat, lng: fromCoord.lng, city: fromCoord.city } : null,
    to_coords: toCoord ? { lat: toCoord.lat, lng: toCoord.lng, city: toCoord.city } : null,
    weight_kg: totalKg,
    distance_km: distKm,
    quotes,
    recommended_mode: recommended,
    source: SHIPPO_TOKEN ? "shippo+estimate" : "estimate",
  });
});

async function fetchShippo(toCountry: string, weightKg: number) {
  // Shippo /shipments → rates endpoint
  const res = await fetch("https://api.goshippo.com/shipments/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `ShippoToken ${SHIPPO_TOKEN}`,
    },
    body: JSON.stringify({
      address_from: { country: "TR", zip: "34000", city: "Istanbul" },
      address_to: { country: toCountry, zip: "10115", city: "Berlin" }, // generic
      parcels: [{
        length: "30", width: "20", height: "15", distance_unit: "cm",
        weight: String(weightKg), mass_unit: "kg",
      }],
      async: false,
    }),
  });
  if (!res.ok) throw new Error(`shippo ${res.status}`);
  const j = await res.json();
  const cheapest = (j.rates ?? []).sort((a: any, b: any) => Number(a.amount) - Number(b.amount))[0];
  if (!cheapest) throw new Error("rate yok");
  return {
    amount: Number(cheapest.amount),
    currency: cheapest.currency ?? "EUR",
    provider: cheapest.provider ?? "Shippo",
    days: cheapest.estimated_days ?? undefined,
  };
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
