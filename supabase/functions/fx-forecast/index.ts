// supabase/functions/fx-forecast
// Gerçek döviz kuru: frankfurter.dev (anahtarsız ücretsiz API, ECB verisi).
// Son 30 günü çekiyor, basit linear-trend + 7 günlük tahmin üretiyor.
// Sonucu fx_snapshots tablosuna kaydediyor.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Req {
  base?: string; // default "TRY"
  symbols?: string[]; // default ["EUR","USD","GBP","AED","SAR","JPY"]
  days?: number; // default 30
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  let body: Req = {};
  try {
    if (req.method === "POST") body = await req.json();
  } catch { /* */ }

  const base = body.base ?? "TRY";
  // Frankfurter desteklediği para birimleri (AED, SAR yok, onun yerine CHF, CNY)
  const symbols = body.symbols ?? ["EUR", "USD", "GBP", "CHF", "JPY", "CNY"];
  const days = Math.min(60, Math.max(7, body.days ?? 30));

  const end = new Date();
  const start = new Date(end.getTime() - days * 86400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  // frankfurter.dev timeseries
  const url = `https://api.frankfurter.dev/v1/${fmt(start)}..${fmt(end)}?base=${base}&symbols=${symbols.join(",")}`;
  let raw: any;
  try {
    const res = await fetch(url);
    raw = await res.json();
    if (!raw.rates) throw new Error("API yanıtı geçersiz");
  } catch (e) {
    return json({ error: `frankfurter.dev: ${e instanceof Error ? e.message : String(e)}` }, 502);
  }

  // rates: { "2026-04-02": { "EUR": 0.0xxx, ... }, ... }
  // Bizim ihtiyacımız tersi: 1 EUR = ? TRY → 1/rate
  const dates = Object.keys(raw.rates).sort();
  const result: Record<string, {
    pair: string;
    history: { date: string; value: number }[];
    current: number;
    change_24h_pct: number;
    forecast_7d: { date: string; value: number }[];
    trend: "up" | "down" | "flat";
  }> = {};

  for (const sym of symbols) {
    const history = dates
      .map((d) => {
        const r = raw.rates[d]?.[sym];
        if (!r || r === 0) return null;
        return { date: d, value: +(1 / r).toFixed(4) }; // base→sym ters çevrildi
      })
      .filter(Boolean) as { date: string; value: number }[];

    if (history.length < 2) continue;

    const current = history[history.length - 1].value;
    const yesterday = history[history.length - 2].value;
    const change_24h_pct = +(((current - yesterday) / yesterday) * 100).toFixed(2);

    // Linear regression (basit en küçük kareler)
    const n = history.length;
    const xs = history.map((_, i) => i);
    const ys = history.map((h) => h.value);
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - xMean) * (ys[i] - yMean);
      den += (xs[i] - xMean) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = yMean - slope * xMean;

    const forecast_7d: { date: string; value: number }[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(end.getTime() + i * 86400_000);
      forecast_7d.push({
        date: fmt(d),
        value: +(intercept + slope * (n - 1 + i)).toFixed(4),
      });
    }

    const last7Avg = ys.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, ys.length);
    const futureAvg = forecast_7d.reduce((a, b) => a + b.value, 0) / 7;
    const trend: "up" | "down" | "flat" =
      futureAvg > last7Avg * 1.005 ? "up"
      : futureAvg < last7Avg * 0.995 ? "down"
      : "flat";

    result[sym] = {
      pair: `${sym}/${base}`,
      history,
      current,
      change_24h_pct,
      forecast_7d,
      trend,
    };
  }

  // fx_snapshots'a yaz (cache amaçlı)
  try {
    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const rows = Object.entries(result).map(([sym, r]) => ({
      base: sym,    // örn EUR
      quote: base,  // örn TRY
      rate: r.current,
      forecast: r.forecast_7d,
    }));
    if (rows.length) await supa.from("fx_snapshots").insert(rows);
  } catch { /* cache opsiyonel */ }

  return json({ base, days, pairs: result });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
