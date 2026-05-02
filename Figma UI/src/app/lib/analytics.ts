// Faz 4: FX, Shipping, Carbon edge function client'ları.

import { ANON_KEY, FUNCTIONS_URL } from "./supabase";

async function call<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${FUNCTIONS_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as any).error || `${path} ${res.status}`);
  return j as T;
}

// ---------- FX ----------
export interface FxPair {
  pair: string;
  current: number;
  change_24h_pct: number;
  trend: "up" | "down" | "flat";
  history: { date: string; value: number }[];
  forecast_7d: { date: string; value: number }[];
}
export interface FxResponse {
  base: string;
  days: number;
  pairs: Record<string, FxPair>;
}

export function fetchFx(opts?: { base?: string; symbols?: string[] }) {
  return call<FxResponse>("fx-forecast", opts ?? {});
}

// ---------- Shipping ----------
export interface ShippingQuote {
  mode: "Hava" | "Kara" | "Deniz" | "Demiryolu";
  provider: string;
  currency: string;
  cost_eur: number;
  cost_per_kg: number;
  transit_days: number;
  co2_kg: number;
  distance_km: number;
}
export interface ShippingResponse {
  from_country: string;
  to_country: string;
  from_coords?: { lat: number; lng: number; city: string } | null;
  to_coords?: { lat: number; lng: number; city: string } | null;
  weight_kg: number;
  distance_km: number;
  quotes: ShippingQuote[];
  recommended_mode: ShippingQuote["mode"];
  source: string;
}

export function fetchShipping(opts: {
  to_country: string;
  weight_kg: number;
  pieces?: number;
}) {
  return call<ShippingResponse>("shipping-quote", opts);
}

// ---------- Carbon ----------
export interface CarbonResponse {
  co2e_kg: number;
  source: string;
  weight_kg: number;
  distance_km: number;
  mode: string;
}

export function fetchCarbon(opts: {
  weight_kg: number;
  distance_km: number;
  mode: ShippingQuote["mode"];
}) {
  return call<CarbonResponse>("carbon-estimate", opts);
}
