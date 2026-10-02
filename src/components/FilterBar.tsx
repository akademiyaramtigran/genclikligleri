import Link from "next/link";
import { cn } from "@/lib/utils";

/** URL parametreleriyle çalışan basit filtre çipleri (sunucu bileşeni) */
export function FilterChips({
  name, options, value, params, basePath, allLabel = "Tümü",
}: {
  name: string;
  options: { value: string; label: string }[];
  value?: string;
  params: Record<string, string | undefined>;
  basePath: string;
  allLabel?: string | null;
}) {
  const href = (v?: string) => {
    const sp = new URLSearchParams();
    for (const [k, val] of Object.entries(params)) if (val && k !== name && k !== "sayfa") sp.set(k, val);
    if (v) sp.set(name, v);
    const q = sp.toString();
    return q ? `${basePath}?${q}` : basePath;
  };
  const all = allLabel ? [{ value: "", label: allLabel }, ...options] : options;
  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {all.map((o) => {
        const on = (value ?? "") === o.value;
        return (
          <Link key={o.value || "all"} href={href(o.value || undefined)} scroll={false}
            className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition", on ? "bg-basalt-900 text-white" : "bg-white text-basalt-600 ring-1 ring-basalt-200 hover:ring-basalt-300")}>
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Pagination({ page, total, perPage, basePath, params }: { page: number; total: number; perPage: number; basePath: string; params: Record<string, string | undefined> }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "sayfa") sp.set(k, v);
    if (p > 1) sp.set("sayfa", String(p));
    const q = sp.toString();
    return q ? `${basePath}?${q}` : basePath;
  };
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2);
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1">
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1">
          {i > 0 && n - nums[i - 1]! > 1 && <span className="px-1 text-basalt-400">…</span>}
          <Link href={href(n)} className={cn("flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold", n === page ? "bg-basalt-900 text-white" : "bg-white text-basalt-600 ring-1 ring-basalt-200 hover:bg-basalt-50")}>{n}</Link>
        </span>
      ))}
    </nav>
  );
}
