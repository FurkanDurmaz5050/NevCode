import { useEffect, useRef } from "react";

// Leaflet CDN'den index.html ile yüklendiği için global window.L üzerinden erişiyoruz.
declare global {
  interface Window {
    L?: any;
  }
}

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  flag?: string;
  /** Çizgi rengi (mod bazında) */
  color?: string;
}

interface Props {
  origin: MapPoint;
  destinations: MapPoint[];
  height?: number;
  className?: string;
}

/**
 * OpenStreetMap (Leaflet) tabanlı çoklu rota haritası.
 * Origin'den her bir destination'a curve-like polyline çizer.
 */
export function RouteMap({ origin, destinations, height = 360, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      const L = window.L;
      const el = containerRef.current;
      if (!L || !el) {
        // Leaflet henüz yüklenmediyse tekrar dene
        return setTimeout(init, 120);
      }

      // Önceki harita varsa yok et (ör. hot reload)
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(el, {
        zoomControl: true,
        scrollWheelZoom: false,
        worldCopyJump: true,
      }).setView([origin.lat, origin.lng], 3);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      // Origin marker
      const originIcon = L.divIcon({
        className: "",
        html: `<div style="background:#0f172a;color:#fff;padding:4px 8px;border-radius:9999px;font-size:11px;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,.2);white-space:nowrap;">${origin.flag ?? "📍"} ${origin.label}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(map);

      const bounds: [number, number][] = [[origin.lat, origin.lng]];

      destinations.forEach((d) => {
        const destIcon = L.divIcon({
          className: "",
          html: `<div style="background:#10b981;color:#fff;padding:4px 8px;border-radius:9999px;font-size:11px;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,.2);white-space:nowrap;">${d.flag ?? "🌍"} ${d.label}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        L.marker([d.lat, d.lng], { icon: destIcon }).addTo(map);

        // Geodesic-ish curve: orta noktayı biraz yukarı kaydırarak yay efekti.
        const midLat = (origin.lat + d.lat) / 2;
        const midLng = (origin.lng + d.lng) / 2;
        const dx = d.lng - origin.lng;
        const dy = d.lat - origin.lat;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const curveLat = midLat + dist * 0.15;
        const curveLng = midLng;

        const points: [number, number][] = [];
        for (let t = 0; t <= 1; t += 0.05) {
          // Quadratic Bezier
          const lat =
            (1 - t) * (1 - t) * origin.lat +
            2 * (1 - t) * t * curveLat +
            t * t * d.lat;
          const lng =
            (1 - t) * (1 - t) * origin.lng +
            2 * (1 - t) * t * curveLng +
            t * t * d.lng;
          points.push([lat, lng]);
        }

        L.polyline(points, {
          color: d.color ?? "#10b981",
          weight: 2.5,
          opacity: 0.85,
          dashArray: "6 6",
        }).addTo(map);

        bounds.push([d.lat, d.lng]);
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    };

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ origin, destinations })]);

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden border border-slate-200 ${className}`}
      style={{ height }}
    />
  );
}
