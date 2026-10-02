"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { openFile } from "@/lib/files";
import type { AppDocument } from "@/lib/types";

export function DocLink({ doc }: { doc: AppDocument }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <button
      type="button"
      onClick={async () => {
        setBusy(true); setErr(null);
        try { await openFile(doc.path); } catch (e) { setErr(e instanceof Error ? e.message : "Açılamadı"); } finally { setBusy(false); }
      }}
      className="flex items-center gap-3 rounded-xl border border-basalt-200 p-3 text-left transition hover:border-dicle-400 hover:bg-dicle-500/5"
    >
      <FileText className="h-8 w-8 shrink-0 text-dicle-600" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{doc.label}</span>
        <span className="block truncate text-xs text-basalt-500">{err ?? `${doc.fileName} · ${(doc.size / 1024 / 1024).toFixed(2)} MB`}</span>
      </span>
      {busy ? <Loader2 className="h-4 w-4 animate-spin text-basalt-400" /> : <Download className="h-4 w-4 text-basalt-400" />}
    </button>
  );
}
