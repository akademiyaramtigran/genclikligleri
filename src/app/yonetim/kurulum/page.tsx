"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { CheckCircle2, Database, Loader2, ShieldCheck } from "lucide-react";
import { fauth, fdb, firebaseReady } from "@/lib/firebase";
import { loadAdmin } from "@/lib/admin";
import { seedDemo } from "@/lib/seed";
import { errMessage } from "@/lib/form";
import { useData, useTitle } from "@/lib/hooks";
import { Logo } from "@/components/Header";

/** İlk kurulum: ilk süper yöneticiyi oluşturur (yalnızca bir kez çalışır) ve isteğe bağlı demo verisi yükler */
export default function SetupPage() {
  useTitle("İlk Kurulum");
  const { data: done, reload } = useData(async () => (firebaseReady ? (await getDoc(doc(fdb(), "config", "bootstrap"))).exists() : false), []);
  const [step, setStep] = useState<"form" | "seed" | "finished">("form");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState("");

  return (
    <div className="bg-basalt-wall flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-3 text-white"><Logo size={64} /><span className="font-display text-2xl font-semibold uppercase tracking-wider">İlk Kurulum</span></div>
        <div className="card p-8">
          {!firebaseReady && <p className="text-sm text-red-600">Firebase yapılandırması eksik.</p>}
          {firebaseReady && done === undefined && <Loader2 className="mx-auto h-6 w-6 animate-spin text-basalt-400" />}
          {done && step === "form" && (
            <div className="text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="mt-3 font-semibold">Kurulum zaten tamamlanmış.</p>
              <p className="mt-1 text-sm text-basalt-500">Yeni yöneticileri panelden Kullanıcılar bölümünde ekleyebilirsiniz.</p>
              <Link href="/yonetim/giris" className="btn-primary mt-5">Giriş Sayfası</Link>
            </div>
          )}
          {done === false && step === "form" && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = String(fd.get("name")).trim(), email = String(fd.get("email")).trim().toLowerCase(), pw = String(fd.get("password"));
                if (pw.length < 8) { setError("Şifre en az 8 karakter olmalıdır."); return; }
                setPending(true); setError(null);
                try {
                  const cred = await createUserWithEmailAndPassword(fauth(), email, pw);
                  const b = writeBatch(fdb());
                  b.set(doc(fdb(), "admins", cred.user.uid), { name, email, role: "SUPER_ADMIN", scope: "ALL", active: true, createdAt: new Date() });
                  b.set(doc(fdb(), "config", "bootstrap"), { by: cred.user.uid, at: new Date() });
                  await b.commit();
                  await loadAdmin(cred.user.uid);
                  setStep("seed");
                  reload();
                } catch (err) { setError(errMessage(err)); } finally { setPending(false); }
              }}
            >
              <h1 className="text-xl font-bold">Süper yönetici hesabı oluştur</h1>
              <p className="text-sm text-basalt-500">Bu ekran yalnızca bir kez kullanılabilir. Oluşturduğunuz hesap tüm organizasyonu yönetir.</p>
              <div><label className="label">Ad Soyad</label><input name="name" required className="input" /></div>
              <div><label className="label">E-posta</label><input name="email" type="email" required className="input" autoComplete="username" /></div>
              <div><label className="label">Şifre (en az 8 karakter)</label><input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" /></div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button disabled={pending} className="btn-primary w-full py-3">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Hesabı Oluştur</button>
            </form>
          )}
          {step === "seed" && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h2 className="text-lg font-bold">Yönetici hesabı hazır!</h2>
              <p className="text-sm text-basalt-500">Siteyi denemek için örnek veri (8 lig, takımlar, oyuncular, maçlar, müzik yarışması, tiyatro festivali) yükleyebilirsiniz. Daha sonra panelden silip gerçek verileri girebilirsiniz.</p>
              {progress && <p className="text-sm font-medium text-dicle-700">{progress}</p>}
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button disabled={pending} className="btn-accent" onClick={async () => {
                  setPending(true); setError(null);
                  try { await seedDemo(setProgress); setStep("finished"); } catch (err) { setError(errMessage(err)); } finally { setPending(false); }
                }}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} Demo Verisi Yükle</button>
                <button disabled={pending} className="btn-outline" onClick={() => setStep("finished")}>Boş Başla</button>
              </div>
            </div>
          )}
          {step === "finished" && (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="mt-3 font-semibold">Kurulum tamamlandı 🎉</p>
              <div className="mt-5 flex justify-center gap-2"><Link href="/yonetim" className="btn-primary">Yönetim Paneli</Link><Link href="/" className="btn-outline">Siteyi Gör</Link></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
