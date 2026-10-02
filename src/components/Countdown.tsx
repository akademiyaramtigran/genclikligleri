"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms / 3_600_000) % 24),
    m: Math.floor((ms / 60_000) % 60),
    s: Math.floor((ms / 1000) % 60),
    done: ms === 0,
  };
}

export function Countdown({ to, className, dark = true, label }: { to: string | Date; className?: string; dark?: boolean; label?: string }) {
  const tr = useT();
  const target = new Date(to).getTime();
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);
  useEffect(() => {
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  const cells: [string, number | undefined][] = [["Gün", t?.d], ["Saat", t?.h], ["Dk", t?.m], ["Sn", t?.s]];
  return (
    <div className={className}>
      {label && <p className={cn("mb-2 text-xs font-semibold uppercase tracking-widest", dark ? "text-white/60" : "text-basalt-500")}>{label}</p>}
      <div className="flex gap-2">
        {cells.map(([k, v]) => (
          <div key={k} className={cn("min-w-[3.5rem] rounded-xl px-2 py-2 text-center", dark ? "bg-white/10 ring-1 ring-white/15" : "bg-basalt-100")}>
            <div className={cn("font-display text-2xl font-semibold tabular-nums", dark ? "text-white" : "text-basalt-900")}>{v == null ? "--" : String(v).padStart(2, "0")}</div>
            <div className={cn("text-[10px] uppercase tracking-wider", dark ? "text-white/50" : "text-basalt-500")}>{tr(k)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
