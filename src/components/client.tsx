"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { firebaseReady } from "@/lib/firebase";
import { cn } from "@/lib/utils";

/** useSearchParams kullanan sayfalar statik dışa aktarımda Suspense içinde olmalı */
export function Suspended({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return <Suspense fallback={<PageLoader dark={dark} />}>{children}</Suspense>;
}

export function useParam(name: string) {
  return useSearchParams().get(name) ?? undefined;
}

export function PageLoader({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <div className={cn("flex min-h-[50vh] items-center justify-center", dark ? "bg-[#0b0614] text-white/60" : "text-basalt-400", className)}>
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export function ErrorBox({ message, dark }: { message: string; dark?: boolean }) {
  const setup = !firebaseReady;
  return (
    <div className={cn("container-x py-16", dark && "text-white")}>
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
        <AlertTriangle className="h-10 w-10" />
        <p className="mt-3 font-semibold">{setup ? "Site henüz yapılandırılmadı" : "Veriler yüklenemedi"}</p>
        <p className="mt-1 text-sm">{setup ? "Firebase bağlantı bilgileri eklenince içerik burada görünecek." : message}</p>
      </div>
    </div>
  );
}

export function NotFoundBox({ title = "Kayıt bulunamadı" }: { title?: string }) {
  return (
    <div className="bg-basalt-wall flex min-h-[60vh] flex-col items-center justify-center px-4 text-center text-white">
      <p className="font-display text-[6rem] font-bold leading-none text-white/10">404</p>
      <h1 className="-mt-6 font-display text-2xl font-semibold uppercase">{title}</h1>
    </div>
  );
}

/** GitHub Pages alt klasörünü (basePath) ham bağlantılara ekler */
export const withBase = (p: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${p}`;
