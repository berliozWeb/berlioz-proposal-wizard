import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WEEKEND_MINIMUMS, CUTOFF_CONFIG } from "@/domain/shared/BusinessRules";

export interface SiteSettings {
  whatsapp_number: string;
  whatsapp_message: string;
  contact_phone: string;
  contact_email: string;
  announcement_enabled: boolean;
  announcement_text: string;
  calendar_id: string;
  min_saturday: number;
  min_sunday: number;
  min_holiday: number;
  cutoff_hour: number;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  whatsapp_number: "525582375469",
  whatsapp_message: "Hola, quiero cotizar mis Boxes Berlioz",
  contact_phone: "55 8237 5469",
  contact_email: "hola@berlioz.mx",
  announcement_enabled: false,
  announcement_text: "",
  calendar_id: "hola@berlioz.mx",
  min_saturday: 3000,
  min_sunday: 5000,
  min_holiday: 5000,
  cutoff_hour: 15,
};

export const SETTINGS_KEY = ["site_settings", "general"];

export function applyRules(s: SiteSettings) {
  WEEKEND_MINIMUMS.saturday = Number(s.min_saturday) || DEFAULT_SETTINGS.min_saturday;
  WEEKEND_MINIMUMS.sunday = Number(s.min_sunday) || DEFAULT_SETTINGS.min_sunday;
  WEEKEND_MINIMUMS.holiday = Number(s.min_holiday) || DEFAULT_SETTINGS.min_holiday;
  CUTOFF_CONFIG.hour = Number(s.cutoff_hour) || DEFAULT_SETTINGS.cutoff_hour;
}

async function fetchSettings(): Promise<SiteSettings> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", "general").maybeSingle();
  const merged = { ...DEFAULT_SETTINGS, ...((data?.value as Partial<SiteSettings>) ?? {}) };
  applyRules(merged);
  return merged;
}

export function useSiteSettings() {
  const q = useQuery({ queryKey: SETTINGS_KEY, queryFn: fetchSettings, staleTime: 5 * 60_000 });
  return { settings: q.data ?? DEFAULT_SETTINGS, loading: q.isLoading };
}

export function useInvalidateSettings() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: SETTINGS_KEY });
}

export function whatsappUrl(s: SiteSettings, withMessage = true) {
  const base = `https://wa.me/${s.whatsapp_number.replace(/\D/g, "")}`;
  return withMessage && s.whatsapp_message ? `${base}?text=${encodeURIComponent(s.whatsapp_message)}` : base;
}
