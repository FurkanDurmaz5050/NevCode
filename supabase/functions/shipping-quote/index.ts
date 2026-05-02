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

// Türkiye'den (İstanbul ~41N 29E) yaklaşık km uzaklıklar
const DISTANCE_KM: Record<string, number> = {
  DE: 2200, NL: 2700, GB: 2800, FR: 2500, IT: 1500, ES: 3200,
  AE: 3500, SA: 2400, US: 8800, JP: 9000, SE: 2800,
};

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return json({ error: "POST gerekli" }, 405);

  let body: Req;
  try { body = await req.json(); } catch { return json({ error: "Geçersiz JSON" }, 400); }
  if (!body.to_country || !body.weight_kg) return json({ error: "to_country ve weight_kg zorunlu" }, 400);

  const totalKg = body.weight_kg * (body.pieces ?? 1);
  const distKm = DISTANCE_KM[body.to_country.toUpperCase()] ?? 2500;

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
    from_country: body.from_country ?? "TR",
    to_country: body.to_country.toUpperCase(),
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
