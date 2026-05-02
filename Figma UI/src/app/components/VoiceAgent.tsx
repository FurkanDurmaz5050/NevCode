import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, Volume2 } from "lucide-react";

type Turn = { who: "agent" | "caller"; text: string };

const ELEVENLABS_PHONE_NUMBER = "+90 (—) — — —"; // kullanıcı tarafından sağlanacak

export function VoiceAgent({ productName }: { productName: string }) {
  const [calling, setCalling] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const timerRef = useRef<number | null>(null);

  const script: Turn[] = [
    { who: "agent", text: `Merhaba, ${productName} teknik destek hattına hoş geldiniz. Size nasıl yardımcı olabilirim?` },
    { who: "caller", text: "Geçen hafta sipariş verdim ama henüz kargo bilgisi gelmedi." },
    { who: "agent", text: "Hemen kontrol ediyorum. Siparişiniz Hollanda deposundan deniz yoluyla yola çıktı, 4 gün içinde teslim edilecek." },
    { who: "caller", text: "Teşekkürler. Ürün kullanımıyla ilgili de bir sorum var." },
    { who: "agent", text: "Tabii, dinliyorum. İsterseniz size video kılavuzunu da SMS ile gönderebilirim." },
  ];

  useEffect(() => {
    if (!calling) return;
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    let i = 0;
    const reveal = setInterval(() => {
      if (i < script.length) {
        setTranscript((t) => [...t, script[i]]);
        i++;
      } else {
        clearInterval(reveal);
      }
    }, 2200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(reveal);
    };
  }, [calling]);

  const start = () => { setSeconds(0); setTranscript([]); setCalling(true); };
  const stop = () => { setCalling(false); if (timerRef.current) clearInterval(timerRef.current); };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div>
      <div className="p-4 rounded-xl bg-slate-900 text-white mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-slate-400">Bağlı numara (ElevenLabs)</p>
            <p className="text-sm tabular-nums" style={{ fontWeight: 500 }}>{ELEVENLABS_PHONE_NUMBER}</p>
          </div>
          <span className={`w-2 h-2 rounded-full ${calling ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Volume2 className="w-3 h-3" />
          Ajan: "Aylin" · Türkçe / İngilizce / Almanca
        </div>
      </div>

      <div className="h-44 overflow-y-auto rounded-xl bg-slate-50 border border-slate-200 p-3 mb-3 space-y-2">
        {transcript.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-12">
            Test çağrısı başlatın — örnek bir destek senaryosunu canlandıracak.
          </p>
        ) : (
          transcript.map((t, i) => (
            <div key={i} className={`flex ${t.who === "agent" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                t.who === "agent" ? "bg-white border border-slate-200" : "bg-sky-600 text-white"
              }`}>
                {t.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        {!calling ? (
          <button onClick={start} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition">
            <Phone className="w-4 h-4" /> Test çağrısı başlat
          </button>
        ) : (
          <button onClick={stop} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm flex items-center justify-center gap-2 hover:bg-rose-700 transition">
            <PhoneOff className="w-4 h-4" /> Sonlandır · {mm}:{ss}
          </button>
        )}
        <button className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
          <Mic className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
