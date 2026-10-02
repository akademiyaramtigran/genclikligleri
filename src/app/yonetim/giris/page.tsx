import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/Header";
import Link from "next/link";

export const metadata: Metadata = { title: "Yönetim Girişi", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/yonetim");
  const { next } = await searchParams;
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
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
