import { useState } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing, Mic, Settings2, Languages, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { startOutboundCall, type CallStatus } from "../../lib/voice";

const ELEVENLABS_PHONE_NUMBER = "+90 (—) — — —";

const callVolume = Array.from({ length: 14 }, (_, i) => ({ d: `${i + 1}`, v: 30 + Math.round(Math.sin(i / 2) * 15 + Math.random() * 20) }));

const calls = [
  { id: 1, type: "in", from: "+49 30 ...", country: "🇩🇪", topic: "Sipariş takibi", duration: "2:14", sentiment: "Olumlu", time: "14:32" },
  { id: 2, type: "in", from: "+31 20 ...", country: "🇳🇱", topic: "İade talebi", duration: "4:08", sentiment: "Nötr", time: "13:55" },
  { id: 3, type: "out", from: "+971 4 ...", country: "🇦🇪", topic: "Kampanya bilgi", duration: "1:42", sentiment: "Olumlu", time: "12:20" },
  { id: 4, type: "in", from: "+44 20 ...", country: "🇬🇧", topic: "Teknik destek", duration: "6:31", sentiment: "Olumsuz", time: "11:08" },
  { id: 5, type: "in", from: "+49 89 ...", country: "🇩🇪", topic: "Ürün kullanımı", duration: "3:22", sentiment: "Olumlu", time: "10:14" },
];

export function VoicePage() {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<CallStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const dialing = status === "dialing";

  const handleCall = async () => {
    setMessage(null);
    setStatus("dialing");
    try {
      const res = await startOutboundCall(phone);
      setStatus("connected");
      setMessage(
        res.conversationId
          ? `Çağrı başlatıldı. Telefonunuzu kontrol edin. (id: ${res.conversationId.slice(0, 8)}…)`
          : "Çağrı başlatıldı. Telefonunuzu kontrol edin.",
      );
    } catch (err) {
      setStatus("error");
      setMessage((err as Error).message || "Çağrı başlatılamadı.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>Sesli Destek</h1>
          <p className="text-sm text-slate-500 mt-1">ElevenLabs AI ses ajanı · 7/24 çağrı yönetimi</p>
        </div>
        <button className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm flex items-center gap-1.5">
          <Settings2 className="w-3.5 h-3.5" /> Ajan ayarları
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500">Bu ay çağrı hacmi</p>
              <p className="text-2xl tracking-tight" style={{ fontWeight: 600 }}>1.247</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Ortalama süre</p>
              <p className="text-lg tabular-nums">3:18</p>
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={callVolume}>
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2e8f0" }} />
                <Line type="monotone" dataKey="v" stroke="#0284c7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 text-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-emerald-400" />
            <p className="text-sm" style={{ fontWeight: 500 }}>Bağlı numara</p>
          </div>
          <p className="text-lg tabular-nums mb-4">{ELEVENLABS_PHONE_NUMBER}</p>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Aktif · Ajan "Aylin"</div>
            <div className="flex items-center gap-2"><Languages className="w-3 h-3" /> TR · EN · DE · AR · NL</div>
            <div className="flex items-center gap-2"><Mic className="w-3 h-3" /> ses kalitesi: yüksek</div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <label className="text-xs text-slate-400">Beni şu numaradan ara</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 555 111 22 33"
              disabled={dialing}
              autoComplete="tel"
              inputMode="tel"
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:bg-white/15 disabled:opacity-60"
            />
            <button
              onClick={handleCall}
              disabled={dialing || phone.trim().length < 7}
              className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-slate-400 text-slate-900 text-sm flex items-center justify-center gap-2 transition"
            >
              {dialing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Aranıyor…
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" /> Beni Ara
                </>
              )}
            </button>
            {message && (
              <div
                className={`flex items-start gap-2 text-xs px-2.5 py-2 rounded-lg ${
                  status === "error"
                    ? "bg-rose-500/10 text-rose-300"
                    : "bg-emerald-500/10 text-emerald-300"
                }`}
              >
                {status === "error" ? (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug break-words">{message}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SmallStat label="Ortalama yanıt" value="0.4 sn" tone="emerald" />
        <SmallStat label="Çözüm oranı" value="%82" tone="emerald" />
        <SmallStat label="Eskalasyon" value="%6" tone="amber" />
        <SmallStat label="CSAT" value="4.7/5" tone="emerald" />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <p style={{ fontWeight: 600 }}>Son çağrılar</p>
          <button className="text-xs text-emerald-600">Tümünü gör →</button>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="text-left px-5 py-2"></th>
              <th className="text-left px-5 py-2">Numara</th>
              <th className="text-left px-5 py-2">Konu</th>
              <th className="text-right px-5 py-2">Süre</th>
              <th className="text-right px-5 py-2">Duygu</th>
              <th className="text-right px-5 py-2">Saat</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  {c.type === "in" ? <PhoneIncoming className="w-4 h-4 text-emerald-500" /> : <PhoneOutgoing className="w-4 h-4 text-sky-500" />}
                </td>
                <td className="px-5 py-3"><span className="mr-1.5">{c.country}</span>{c.from}</td>
                <td className="px-5 py-3 text-slate-600">{c.topic}</td>
                <td className="px-5 py-3 text-right tabular-nums">{c.duration}</td>
                <td className="px-5 py-3 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.sentiment === "Olumlu" ? "bg-emerald-50 text-emerald-700" :
                    c.sentiment === "Nötr" ? "bg-slate-100 text-slate-600" :
                    "bg-rose-50 text-rose-700"
                  }`}>{c.sentiment}</span>
                </td>
                <td className="px-5 py-3 text-right text-slate-500 tabular-nums">{c.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SmallStat({ label, value, tone }: any) {
  const tones: Record<string, string> = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  };
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl tracking-tight ${tones[tone]}`} style={{ fontWeight: 600 }}>{value}</p>
    </div>
  );
}
