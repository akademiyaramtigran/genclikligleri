import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";

export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser() {
  const s = await getSession();
  if (!s) return null;
  const user = await db.user.findUnique({ where: { id: s.uid } });
  if (!user || !user.active) return null;
  return user;
}

export type Unit = "SPOR" | "MUZIK" | "TIYATRO";

export function canAccess(user: { role: string; scope: string }, unit?: Unit) {
  if (user.role === "SUPER_ADMIN" || user.scope === "ALL") return true;
  return unit ? user.scope === unit : false;
}

/** Sunucu tarafında yetki kontrolü — yetkisizse yönlendirir */
export async function requireUser(unit?: Unit) {
  const user = await getCurrentUser();
  if (!user) redirect("/yonetim/giris");
  if (unit && !canAccess(user, unit)) redirect("/yonetim?yetki=yok");
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/yonetim?yetki=yok");
  return user;
}

export async function login(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  const token = await signSession({ uid: user.id, role: user.role, scope: user.scope, name: user.name });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user;
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function logActivity(userId: string | null, action: string, entity: string, entityId?: string, details?: string) {
  await db.activityLog.create({ data: { userId, action, entity, entityId, details } }).catch(() => {});
}
