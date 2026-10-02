"use server";

import { db } from "@/lib/db";

export type ContactState = { ok: boolean; message: string } | null;

export async function sendMessage(_prev: ContactState, fd: FormData): Promise<ContactState> {
  const g = (k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
  if (g("website")) return { ok: true, message: "Mesajınız alındı." };
  const name = g("name"), email = g("email"), subject = g("subject"), message = g("message", 5000), phone = g("phone", 30);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || subject.length < 2 || message.length < 10) {
    return { ok: false, message: "Lütfen tüm zorunlu alanları doldurun (mesaj en az 10 karakter)." };
  }
  await db.contactMessage.create({ data: { name, email, phone: phone || null, subject, message } });
  return { ok: true, message: "Mesajınız bize ulaştı. En kısa sürede dönüş yapacağız. Teşekkürler!" };
}
