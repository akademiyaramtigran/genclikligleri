"use client";

import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch, type DocumentReference } from "firebase/firestore";
import { fauth, fdb } from "./firebase";
import { clearCache, getAll, getOne, revive } from "./data";
import { notifyChange } from "./hooks";
import { buildLeagueSummary } from "./stats";
import { slugify } from "./utils";
import type { AdminUser, League, Match, Team } from "./types";

export type Unit = "SPOR" | "MUZIK" | "TIYATRO";

let adminCache: { uid: string; admin: AdminUser } | null = null;

export async function loadAdmin(uid: string): Promise<AdminUser | null> {
  const snap = await getDoc(doc(fdb(), "admins", uid));
  if (!snap.exists()) return null;
  const admin = { ...revive<AdminUser>(snap.data()), id: uid };
  if (!admin.active) return null;
  adminCache = { uid, admin };
  return admin;
}

export function canAccess(user: { role: string; scope: string }, unit?: Unit) {
  if (user.role === "SUPER_ADMIN" || user.scope === "ALL") return true;
  return unit ? user.scope === unit : false;
}

/** İşlem öncesi yetki kontrolü (asıl güvenlik Firestore kurallarındadır) */
export async function requireAdmin(unit?: Unit): Promise<AdminUser> {
  const u = fauth().currentUser;
  if (!u) throw new Error("Oturum kapalı. Lütfen tekrar giriş yapın.");
  const admin = adminCache?.uid === u.uid ? adminCache.admin : await loadAdmin(u.uid);
  if (!admin) throw new Error("Yönetici yetkiniz bulunmuyor.");
  if (unit && !canAccess(admin, unit)) throw new Error("Bu birim için yetkiniz yok.");
  return admin;
}

export async function requireSuper() {
  const a = await requireAdmin();
  if (a.role !== "SUPER_ADMIN") throw new Error("Bu işlem yalnızca süper yöneticiye açıktır.");
  return a;
}

export function clearAdminCache() { adminCache = null; }

export async function logActivity(admin: AdminUser | null, action: string, entity: string, entityId?: string, details?: string) {
  await addDoc(collection(fdb(), "logs"), { userId: admin?.id ?? null, userName: admin?.name ?? "Sistem", action, entity, entityId: entityId ?? null, details: details ?? null, createdAt: serverTimestamp() }).catch(() => {});
}

/** Belge kimliği olarak kullanılacak benzersiz slug */
export async function uniqueId(col: string, base: string, current?: string) {
  const root = slugify(base) || "kayit";
  let s = root;
  let i = 2;
  while (s !== current && (await getDoc(doc(fdb(), col, s))).exists()) s = `${root}-${i++}`;
  return s;
}

export const ref = (col: string, id: string) => doc(fdb(), col, id);
export const newRef = (col: string) => doc(collection(fdb(), col));

/** Değişiklik sonrası: önbelleği temizle, açık sayfaları yenile */
export function changed() {
  clearCache();
  notifyChange();
}

/** 500'lük gruplar halinde toplu yazma */
export async function batchWrite(ops: { ref: DocumentReference; data: Record<string, unknown>; merge?: boolean }[], onProgress?: (done: number) => void) {
  for (let i = 0; i < ops.length; i += 450) {
    const b = writeBatch(fdb());
    for (const op of ops.slice(i, i + 450)) b.set(op.ref, op.data, { merge: !!op.merge });
    await b.commit();
    onProgress?.(Math.min(ops.length, i + 450));
  }
}

export async function batchDelete(refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 450) {
    const b = writeBatch(fdb());
    for (const r of refs.slice(i, i + 450)) b.delete(r);
    await b.commit();
  }
}

export const teamRef = (t: Pick<Team, "slug" | "name" | "shortName" | "logoUrl" | "primaryColor" | "secondaryColor">) => ({
  slug: t.slug, name: t.name, shortName: t.shortName, logoUrl: t.logoUrl ?? null, primaryColor: t.primaryColor, secondaryColor: t.secondaryColor,
});

/** Lig özetini yeniden hesaplayıp lig belgesine yazar (puan durumu, liderler…) */
export async function rebuildLeague(leagueId: string) {
  const league = await getOne<League>("leagues", leagueId);
  if (!league) return;
  const [teams, matches] = await Promise.all([
    getAll<Team>("teams"),
    getAll<Match>("matches", where("leagueId", "==", leagueId)),
  ]);
  const summary = buildLeagueSummary(league, teams, matches);
  await updateDoc(ref("leagues", leagueId), { summary: JSON.parse(JSON.stringify({ ...summary, updatedAt: null })), summaryAt: serverTimestamp() });
}

export async function docsWhere(col: string, field: string, value: unknown) {
  return (await getDocs(query(collection(fdb(), col), where(field, "==", value)))).docs;
}

export { setDoc, updateDoc, serverTimestamp };
