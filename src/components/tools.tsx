"use client";

import { useState } from "react";
import { CalendarPlus, ImageDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { shareOrDownload } from "@/lib/sharecard";
import { downloadIcs, type CalEvent } from "@/lib/calendar";
import { withBase } from "./client";

/** Paylaşım görseli oluştur (Instagram'a hazır PNG) */
export function ShareImageButton({ make, filename, title, className, label = "Paylaşım Görseli" }: { make: () => Promise<Blob>; filename: string; title: string; className?: string; label?: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" disabled={busy} className={cn("btn-outline btn-sm", className)}
      onClick={async () => { setBusy(true); try { await shareOrDownload(await make(), filename, title); } finally { setBusy(false); } }}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageDown className="h-3.5 w-3.5" />} {t(label)}
    </button>
  );
}

/** Takvime ekle (.ics) */
export function CalendarButton({ events, filename, className, label = "Takvime Ekle" }: { events: CalEvent[]; filename: string; className?: string; label?: string }) {
  const t = useT();
  if (events.length === 0) return null;
  return (
    <button type="button" className={cn("btn-outline btn-sm", className)} onClick={() => downloadIcs(events, filename)}>
      <CalendarPlus className="h-3.5 w-3.5" /> {t(label)}
    </button>
  );
}

/** Sitedeki bir sayfanın tam adresi (takvim açıklaması için) */
export const pageUrl = (path: string) => (typeof window === "undefined" ? path : `${window.location.origin}${withBase(path)}`);
