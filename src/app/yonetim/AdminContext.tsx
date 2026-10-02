"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { fauth, firebaseReady } from "@/lib/firebase";
import { clearAdminCache, loadAdmin, canAccess, type Unit } from "@/lib/admin";
import type { AdminUser } from "@/lib/types";

const Ctx = createContext<AdminUser | null>(null);

export function useAdmin() {
  const a = useContext(Ctx);
  if (!a) throw new Error("Yönetici bağlamı yok");
  return a;
}

/** Yönetim sayfalarını korur: oturum yoksa giriş sayfasına yönlendirir */
export function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null | undefined>(undefined);
  useEffect(() => {
    if (!firebaseReady) { setAdmin(null); return; }
    return onAuthStateChanged(fauth(), async (u) => {
      if (!u || u.isAnonymous) { setAdmin(null); return; }
      try { setAdmin(await loadAdmin(u.uid)); } catch { setAdmin(null); }
    });
  }, []);
  useEffect(() => {
    if (admin === null) router.replace(`/yonetim/giris?next=${encodeURIComponent(path)}`);
  }, [admin, path, router]);
  if (!admin) return <div className="flex min-h-screen items-center justify-center bg-basalt-100"><Loader2 className="h-8 w-8 animate-spin text-basalt-400" /></div>;
  return <Ctx.Provider value={admin}>{children}</Ctx.Provider>;
}

/** Birim yetkisi olmayan sayfada uyarı gösterir */
export function RequireUnit({ unit, children, superOnly }: { unit?: Unit; children: ReactNode; superOnly?: boolean }) {
  const admin = useAdmin();
  const ok = superOnly ? admin.role === "SUPER_ADMIN" : canAccess(admin, unit);
  if (!ok) return <div className="rounded-xl bg-amber-50 p-6 text-sm text-amber-800 ring-1 ring-amber-200">Bu bölüm için yetkiniz bulunmuyor.</div>;
  return <>{children}</>;
}

export async function adminLogout() {
  clearAdminCache();
  await signOut(fauth());
}
