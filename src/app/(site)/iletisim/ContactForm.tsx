"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { sendMessage, type ContactState } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, null);
  if (state?.ok) return <div className="card flex flex-col items-center p-10 text-center"><CheckCircle2 className="h-12 w-12 text-emerald-500" /><p className="mt-4 font-semibold">{state.message}</p></div>;
  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Ad Soyad *</label><input name="name" required className="input" /></div>
        <div><label className="label">E-posta *</label><input name="email" type="email" required className="input" /></div>
        <div><label className="label">Telefon</label><input name="phone" type="tel" className="input" /></div>
        <div>
          <label className="label">Konu *</label>
          <select name="subject" required className="input">
            {["Genel Bilgi", "Spor Ligleri", "Müzik Yarışması", "Tiyatro Festivali", "Başvurular", "Gönüllülük / Hakemlik", "Sponsorluk", "Diğer"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div><label className="label">Mesajınız *</label><textarea name="message" required minLength={10} rows={5} className="input" /></div>
      {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
      <button disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gönder</button>
    </form>
  );
}
