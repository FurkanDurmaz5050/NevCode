// İşletme durumu — analiz tamamlandı mı? Posts/Markets/Videos sekmeleri için
// kilit kontrolü buradan yapılır.

import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

export interface BusinessSummary {
  id: string;
  name: string | null;
  product_name: string | null;
  website: string | null;
  category: string | null;
  weight_kg: number | null;
  unit_cost_try: number | null;
  lead_time_days: number | null;
  created_at: string;
}

export interface BusinessState {
  business: BusinessSummary | null;
  marketCount: number;
  hasAnalysis: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useBusinessState(): BusinessState {
  const [business, setBusiness] = useState<BusinessSummary | null>(null);
  const [marketCount, setMarketCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: bizs, error: bizErr } = await supabase
        .from("businesses")
        .select("id,name,product_name,website,category,weight_kg,unit_cost_try,lead_time_days,created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      if (bizErr) {
        console.error("[business] query failed", bizErr);
      }
      const biz = bizs?.[0] ?? null;
      setBusiness(biz as BusinessSummary | null);
      if (biz) {
        const { data: analyses } = await supabase
          .from("analyses")
          .select("id")
          .eq("business_id", biz.id);
        const analysisIds = (analyses ?? []).map((a) => a.id);
        if (analysisIds.length === 0) {
          setMarketCount(0);
        } else {
          const { count } = await supabase
            .from("markets")
            .select("id", { count: "exact", head: true })
            .in("analysis_id", analysisIds);
          setMarketCount(count ?? 0);
        }
      } else {
        setMarketCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    business,
    marketCount,
    hasAnalysis: !!business && marketCount > 0,
    loading,
    refresh,
  };
}
