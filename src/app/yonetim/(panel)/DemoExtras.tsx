"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { seedExtras } from "@/lib/seed-extras";
import { errMessage } from "@/lib/form";

/** Önceden demo verisi yüklenmiş sitelere yeni demo içeriklerini ekler (yalnızca eksik olanları) */
export function DemoExtras() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <Sparkles className="h-8 w-8 shrink-0 text-fuchsia-500" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">Yeni demo içerikleri</p>
        <p className="text-basalt-500">Manşet, haftanın öne çıkanları, Gençliğin Sesi paylaşımları, sezon arşivi ve hakem & gönüllü başvuru dönemi. Yalnızca eksik olanlar eklenir.</p>
        {msg && <p className="mt-1 font-medium text-dicle-700">{msg}</p>}
      </div>
      <button type="button" disabled={busy} className="btn-accent" onClick={async () => {
        setBusy(true);
        try { await seedExtras(setMsg); } catch (e) { setMsg(errMessage(e)); } finally { setBusy(false); }
      }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Demo İçeriklerini Ekle</button>
    </div>
  );
}
