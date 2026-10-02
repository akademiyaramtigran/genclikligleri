"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { serverTimestamp, updateDoc } from "firebase/firestore";
import { Loader2, LogIn } from "lucide-react";
import { fauth } from "@/lib/firebase";
import { loadAdmin, logActivity, ref } from "@/lib/admin";
import { errMessage } from "@/lib/form";
import { useParam } from "@/components/client";

export function LoginForm() {
  const router = useRouter();
  const next = useParam("next");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setPending(true);
        setError(null);
        try {
          const cred = await signInWithEmailAndPassword(fauth(), String(fd.get("email")).trim(), String(fd.get("password")));
          const admin = await loadAdmin(cred.user.uid);
          if (!admin) {
            await signOut(fauth());
            setError("Bu hesabın yönetici yetkisi yok veya hesap pasif.");
            return;
          }
          await updateDoc(ref("admins", cred.user.uid), { lastLoginAt: serverTimestamp() }).catch(() => {});
          await logActivity(admin, "GIRIS", "Oturum");
          router.replace(next?.startsWith("/yonetim") ? next : "/yonetim");
        } catch (err) {
          setError(errMessage(err));
        } finally {
          setPending(false);
        }
      }}
    >
      <div><label className="label" htmlFor="email">E-posta</label><input id="email" name="email" type="email" required autoComplete="username" className="input" /></div>
      <div><label className="label" htmlFor="password">Şifre</label><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="btn-primary w-full py-3">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Giriş Yap</button>
    </form>
  );
}
