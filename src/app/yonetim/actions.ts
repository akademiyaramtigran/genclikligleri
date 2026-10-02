"use server";

import { redirect } from "next/navigation";
import { login, logout, logActivity } from "@/lib/auth";

export type LoginState = { error: string } | null;

const attempts = new Map<string, { n: number; until: number }>();

export async function loginAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = String(fd.get("next") ?? "/yonetim");
  const a = attempts.get(email);
  if (a && a.until > Date.now()) return { error: "Çok fazla hatalı deneme. Lütfen birkaç dakika sonra tekrar deneyin." };
  const user = await login(email, password);
  if (!user) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(email, { n, until: n >= 5 ? Date.now() + 5 * 60_000 : 0 });
    return { error: "E-posta veya şifre hatalı." };
  }
  attempts.delete(email);
  await logActivity(user.id, "GIRIS", "Oturum");
  redirect(next.startsWith("/yonetim") ? next : "/yonetim");
}

export async function logoutAction() {
  await logout();
  redirect("/yonetim/giris");
}
