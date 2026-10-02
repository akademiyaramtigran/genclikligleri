"use client";

import { orderBy, limit, where } from "firebase/firestore";
import { getAll } from "./data";
import type { AdminUser, Application, LogEntry, Match, Message, Period } from "./types";

const scoped = (admin: AdminUser) => admin.role !== "SUPER_ADMIN" && admin.scope !== "ALL";

/** Yöneticinin yetkili olduğu başvurular (kurallar kapsam dışını okumaya izin vermez) */
export async function getApplications(admin: AdminUser) {
  const list = scoped(admin) ? await getAll<Application>("applications", where("category", "==", admin.scope)) : await getAll<Application>("applications");
  return list.sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
}

export async function getAllPeriods(admin: AdminUser) {
  const list = scoped(admin) ? await getAll<Period>("periods", where("category", "==", admin.scope)) : await getAll<Period>("periods");
  return list.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
}

export const getLogs = (n = 50) => getAll<LogEntry>("logs", orderBy("createdAt", "desc"), limit(n));
export const getMessages = async () => (await getAll<Message>("messages")).sort((a, b) => Number(a.isRead) - Number(b.isRead) || (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
export const getAllMatches = async () => (await getAll<Match>("matches")).sort((a, b) => a.date.getTime() - b.date.getTime());
export const getAdmins = async () => (await getAll<AdminUser>("admins")).sort((a, b) => (a.createdAt?.getTime?.() ?? 0) - (b.createdAt?.getTime?.() ?? 0));
