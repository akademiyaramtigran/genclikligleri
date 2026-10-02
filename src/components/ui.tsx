"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn, initials } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/** Metin ise çevir (JSX ise olduğu gibi bırak) */
function useTx() {
  const t = useT();
  return (v: ReactNode) => (typeof v === "string" ? t(v) : v);
}

const TONES: Record<string, string> = {
  slate: "bg-basalt-100 text-basalt-700 ring-basalt-200",
  zinc: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  fuchsia: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  yellow: "bg-yellow-100 text-yellow-800 ring-yellow-300",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  dark: "bg-white/10 text-white ring-white/20",
};

export function Badge({ tone = "slate", children, className, dot }: { tone?: string; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", TONES[tone] ?? TONES.slate, className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full bg-current", tone === "red" && "animate-pulse-dot")} />}
      {children}
    </span>
  );
}

export function StatusBadge({ map, value, dot }: { map: Record<string, { label: string; tone: string }>; value: string; dot?: boolean }) {
  const t = useT();
  const s = map[value] ?? { label: value, tone: "slate" };
  return <Badge tone={s.tone} dot={dot}>{t(s.label)}</Badge>;
}

export function SectionHeader({
  eyebrow, title, description, action, dark, className,
}: { eyebrow?: string; title: ReactNode; description?: ReactNode; action?: ReactNode; dark?: boolean; className?: string }) {
  const tx = useTx();
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow && <p className={cn("eyebrow mb-2", dark ? "text-dicle-300" : "text-dicle-600")}>{tx(eyebrow)}</p>}
        <h2 className={cn("font-display text-2xl font-semibold uppercase tracking-wide sm:text-3xl", dark ? "text-white" : "text-basalt-900")}>{tx(title)}</h2>
        {description && <p className={cn("mt-1.5 max-w-2xl text-sm", dark ? "text-white/60" : "text-basalt-500")}>{tx(description)}</p>}
      </div>
      {action}
    </div>
  );
}

export function TeamCrest({
  team, size = 40, className,
}: { team: { name: string; shortName?: string | null; logoUrl?: string | null; primaryColor?: string | null; secondaryColor?: string | null }; size?: number; className?: string }) {
  if (team.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={team.logoUrl} alt={team.name} width={size} height={size} className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />;
  }
  const label = (team.shortName || initials(team.name)).slice(0, 3);
  return (
    <span
      aria-hidden
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-bold uppercase ring-2 ring-white/70", className)}
      style={{
        width: size, height: size, fontSize: size * 0.32,
        background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,.28), transparent 55%), ${team.primaryColor ?? "#0f766e"}`,
        boxShadow: `inset 0 0 0 ${Math.max(2, Math.round(size * 0.07))}px ${team.secondaryColor ?? "#ffffff"}`,
        color: team.secondaryColor ?? "#fff",
        textShadow: "0 1px 2px rgba(0,0,0,.35)",
      }}
    >
      {label}
    </span>
  );
}

export function Avatar({ name, src, size = 40, className, color }: { name: string; src?: string | null; size?: number; className?: string; color?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />;
  }
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.36, background: color ?? "linear-gradient(135deg,#1e2433,#515c78)" }}
    >
      {initials(name)}
    </span>
  );
}

export function EmptyState({ title, description, action, icon, dark }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode; dark?: boolean }) {
  const t = useT();
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center", dark ? "border-white/15 text-white/70" : "border-basalt-200 bg-white/50 text-basalt-500")}>
      {icon && <div className="mb-3 text-3xl">{icon}</div>}
      <p className={cn("font-semibold", dark ? "text-white" : "text-basalt-800")}>{t(title)}</p>
      {description && <p className="mt-1 max-w-md text-sm">{t(description)}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Tabs({ items, active, dark }: { items: { key: string; label: string; href: string; count?: number }[]; active: string; dark?: boolean }) {
  const tr = useT();
  return (
    <nav className={cn("scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0", dark ? "" : "border-b border-basalt-200")}>
      {items.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            scroll={false}
            className={cn(
              "relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition",
              dark ? (on ? "text-white" : "text-white/50 hover:text-white") : on ? "text-basalt-900" : "text-basalt-500 hover:text-basalt-800",
            )}
          >
            {tr(t.label)}
            {t.count != null && <span className={cn("ml-1.5 rounded-full px-1.5 text-[10px]", dark ? "bg-white/10" : "bg-basalt-100")}>{t.count}</span>}
            {on && <span className={cn("absolute inset-x-3 -bottom-px h-0.5 rounded-full", dark ? "bg-white" : "bg-dicle-500")} />}
          </Link>
        );
      })}
    </nav>
  );
}

export function StatTile({ label, value, sub, icon, dark, className }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; dark?: boolean; className?: string }) {
  const tx = useTx();
  return (
    <div className={cn(dark ? "card-dark p-4" : "card p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-xs font-medium uppercase tracking-wider", dark ? "text-white/50" : "text-basalt-500")}>{tx(label)}</p>
        {icon && <span className={dark ? "text-white/40" : "text-basalt-400"}>{icon}</span>}
      </div>
      <p className={cn("mt-2 font-display text-3xl font-semibold tabular-nums", dark ? "text-white" : "text-basalt-900")}>{value}</p>
      {sub && <p className={cn("mt-0.5 text-xs", dark ? "text-white/50" : "text-basalt-500")}>{tx(sub)}</p>}
    </div>
  );
}

export function PageHero({
  eyebrow, title, description, children, className, tone = "basalt",
}: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; children?: ReactNode; className?: string; tone?: "basalt" | "music" | "theatre" }) {
  const tx = useTx();
  return (
    <section
      className={cn(
        "relative overflow-hidden text-white",
        tone === "basalt" && "bg-basalt-wall",
        tone === "music" && "bg-[#0b0614]",
        tone === "theatre" && "bg-stage-950",
        className,
      )}
    >
      {tone === "basalt" && <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-dicle-500/20 blur-3xl" />}
      <div className="container-x relative py-12 sm:py-16">
        {eyebrow && <div className="eyebrow mb-3 text-dicle-300">{tx(eyebrow)}</div>}
        <h1 className="font-display text-4xl font-semibold uppercase leading-[1.05] tracking-wide text-balance sm:text-5xl">{tx(title)}</h1>
        {description && <p className="mt-3 max-w-2xl text-base text-white/70">{tx(description)}</p>}
        {children}
      </div>
    </section>
  );
}

export function KeyValue({ items, className }: { items: [string, ReactNode][]; className?: string }) {
  const t = useT();
  return (
    <dl className={cn("divide-y divide-basalt-100", className)}>
      {items.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
          <dt className="text-basalt-500">{t(k)}</dt>
          <dd className="text-right font-medium text-basalt-900">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FormBadge({ r }: { r: "G" | "B" | "M" }) {
  const map = { G: "bg-emerald-500", B: "bg-basalt-400", M: "bg-red-500" } as const;
  const t = useT();
  return <span title={t(r === "G" ? "Galibiyet" : r === "B" ? "Beraberlik" : "Mağlubiyet")} className={cn("inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white", map[r])}>{r}</span>;
}
