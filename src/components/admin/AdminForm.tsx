"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { ActionResult } from "@/lib/form";
import { cn } from "@/lib/utils";

type Action = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

/** Yönetim formları: hata durumunda girilen değerler korunur, sonuç mesajı gösterilir */
export function AdminForm({
  action, children, submitLabel = "Kaydet", className, resetOnSuccess, compact, confirm: confirmText,
}: { action: Action; children: ReactNode; submitLabel?: string; className?: string; resetOnSuccess?: boolean; compact?: boolean; confirm?: string }) {
  const [state, dispatch, pending] = useActionState<ActionResult, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
    if (state?.ok && state.redirect) router.push(state.redirect);
  }, [state, resetOnSuccess, router]);
  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirmText && !window.confirm(confirmText)) return;
        const fd = new FormData(e.currentTarget);
        startTransition(() => dispatch(fd));
      }}
    >
      {children}
      <div className={cn("flex flex-wrap items-center gap-3", compact ? "mt-3" : "mt-6")}>
        <button type="submit" disabled={pending} className={cn("btn-primary", compact && "btn-sm")}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}
        </button>
        {state && (
          <p role="status" className={cn("flex items-center gap-1.5 text-sm font-medium", state.ok ? "text-emerald-600" : "text-red-600")}>
            {state.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

/** Tek tıkla çalışan küçük işlem butonu (sil, durum değiştir vb.) */
export function ActionButton({
  action, fields, label, confirm: confirmText, className, icon,
}: { action: Action; fields: Record<string, string>; label: ReactNode; confirm?: string; className?: string; icon?: ReactNode }) {
  const [state, dispatch, pending] = useActionState<ActionResult, FormData>(action, null);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok && state.redirect) router.push(state.redirect);
  }, [state, router]);
  return (
    <form
      className="inline-flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (confirmText && !window.confirm(confirmText)) return;
        const fd = new FormData();
        for (const [k, v] of Object.entries(fields)) fd.set(k, v);
        startTransition(() => dispatch(fd));
      }}
    >
      <button type="submit" disabled={pending} className={className ?? "btn-outline btn-sm"} title={typeof label === "string" ? label : undefined}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon} {label}
      </button>
      {state && !state.ok && <span className="text-xs text-red-600">{state.message}</span>}
    </form>
  );
}
