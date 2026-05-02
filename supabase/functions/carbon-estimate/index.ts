// supabase/functions/carbon-estimate
// Climatiq API (anahtar varsa gerçek), yoksa kg×km×faktör tahmini.

import { corsHeaders, handleOptions } from "../_shared/cors.ts";

const CLIMATIQ_KEY = Deno.env.get("CLIMATIQ_API_KEY");

interface Req {
  weight_kg: number;
  distance_km: number;
  mode: "Hava" | "Kara" | "Deniz" | "Demiryolu";
}

// kg CO2e per kg per km (yaklaşık endüstri ortalamaları)
const FACTORS = {
  Hava: 0.0006,
  Kara: 0.00012,
  Deniz: 0.000015,
  Demiryolu: 0.000028,
};

const CLIMATIQ_ACTIVITY: Record<string, string> = {
  Hava: "freight_flight-route_type_international-aircraft_type_freight",
  Kara: "freight_vehicle-vehicle_type_hgv-fuel_source_diesel-vehicle_weight_gt_3_5t_lt_7_5t-percentage_load_50",
  Deniz: "sea_freight-vessel_type_container_ship-route_type_na-vessel_length_na",
  Demiryolu: "freight_train-fuel_source_diesel",
};

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return json({ error: "POST gerekli" }, 405);

  let body: Req;
  try { body = await req.json(); } catch { return json({ error: "Geçersiz JSON" }, 400); }
  if (!body.weight_kg || !body.distance_km || !body.mode) {
    return json({ error: "weight_kg, distance_km, mode zorunlu" }, 400);
  }

  const factor = FACTORS[body.mode] ?? FACTORS.Kara;
  const fallback = +(body.weight_kg * body.distance_km * factor).toFixed(4);

  if (CLIMATIQ_KEY) {
    try {
      const activity = CLIMATIQ_ACTIVITY[body.mode];
      const res = await fetch("https://api.climatiq.io/data/v1/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CLIMATIQ_KEY}`,
        },
        body: JSON.stringify({
          emission_factor: { activity_id: activity, data_version: "^21" },
          parameters: {
            weight: body.weight_kg / 1000, // Climatiq ton bekliyor
            weight_unit: "t",
            distance: body.distance_km,
            distance_unit: "km",
          },
        }),
      });
      if (res.ok) {
        const j = await res.json();
        return json({
          co2e_kg: +Number(j.co2e ?? fallback).toFixed(4),
          factor_id: activity,
          source: "climatiq",
          weight_kg: body.weight_kg,
          distance_km: body.distance_km,
          mode: body.mode,
        });
      }
    } catch { /* fallback */ }
  }

  return json({
    co2e_kg: fallback,
    factor: factor,
    source: "estimate",
    weight_kg: body.weight_kg,
    distance_km: body.distance_km,
    mode: body.mode,
  });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
