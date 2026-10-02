"use client";

import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/Header";
import { Suspended } from "@/components/client";
import { useTitle } from "@/lib/hooks";

export default function LoginPage() {
  useTitle("Yönetim Girişi");
  return (
    <div className="bg-basalt-wall relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-dicle-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3 text-white">
          <Logo size={48} />
          <span><span className="block font-display text-2xl font-semibold uppercase tracking-wider">Diyarbakır</span><span className="block text-xs uppercase tracking-[0.25em] text-white/50">Gençlik Ligleri</span></span>
        </Link>
        <div className="card p-8">
          <h1 className="text-xl font-bold">Yönetim Paneli</h1>
          <p className="mt-1 text-sm text-basalt-500">Organizasyon yöneticileri için giriş</p>
          <Suspended><LoginForm /></Suspended>
        </div>
        <p className="mt-6 text-center text-xs text-white/50">İlk kurulum mu? <Link href="/yonetim/kurulum" className="underline hover:text-white">Yönetici hesabı oluştur</Link></p>
      </div>
    </div>
  );
}
