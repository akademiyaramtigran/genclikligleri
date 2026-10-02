"use client";

import {
  collection, doc, getDoc, getDocs, query, where, limit as qlimit, getCountFromServer, Timestamp,
  type QueryConstraint, type DocumentData,
} from "firebase/firestore";
import { fdb } from "./firebase";
import type {
  Announcement, AppStatus, League, Match, MusicCompetition, MusicContestant, MusicRound, Period, Player, Season,
  TheatreFestival, TheatreGroup, TheatrePlay, Team, Venue, Video, WritingContest,
} from "./types";

/** Firestore Timestamp → Date (iç içe nesnelerde de) */
export function revive<T>(v: unknown): T {
  if (v instanceof Timestamp) return v.toDate() as T;
  if (Array.isArray(v)) return v.map((x) => revive(x)) as T;
  if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) o[k] = revive(x);
    return o as T;
  }
  return v as T;
}

const withId = <T>(id: string, data: DocumentData) => ({ ...revive<Record<string, unknown>>(data), id, slug: (data.slug as string) ?? id }) as T;

export async function getOne<T>(col: string, id: string | null | undefined): Promise<T | null> {
  if (!id) return null;
  const snap = await getDoc(doc(fdb(), col, id));
  return snap.exists() ? withId<T>(snap.id, snap.data()) : null;
}

export async function getAll<T>(col: string, ...c: QueryConstraint[]): Promise<T[]> {
  const snap = await getDocs(c.length ? query(collection(fdb(), col), ...c) : collection(fdb(), col));
  return snap.docs.map((d) => withId<T>(d.id, d.data()));
}

export async function countOf(col: string, ...c: QueryConstraint[]) {
  const snap = await getCountFromServer(c.length ? query(collection(fdb(), col), ...c) : collection(fdb(), col));
  return snap.data().count;
}

// ── Önbellek: aynı oturumda tekrar tekrar okunan küçük koleksiyonlar ──
const cache = new Map<string, { at: number; p: Promise<unknown> }>();
function cached<T>(key: string, fn: () => Promise<T>, ttl = 60_000): Promise<T> {
  const c = cache.get(key);
  if (c && Date.now() - c.at < ttl) return c.p as Promise<T>;
  const p = fn().catch((e) => { cache.delete(key); throw e; });
  cache.set(key, { at: Date.now(), p });
  return p;
}
export function clearCache() { cache.clear(); }

const byDate = <T extends { date: Date }>(a: T, b: T) => a.date.getTime() - b.date.getTime();

// ───────────── Spor ─────────────

export const getSeasons = () => cached("seasons", () => getAll<Season>("seasons"));
export const getVenues = () => cached("venues", async () => (await getAll<Venue>("venues")).sort((a, b) => a.name.localeCompare(b.name, "tr")));
export const getTeams = () => cached("teams", async () => (await getAll<Team>("teams")).sort((a, b) => a.name.localeCompare(b.name, "tr")));
export const getLeagues = () => cached("leagues", () => getAll<League>("leagues"));
export const getActiveLeagues = async () => (await getLeagues()).filter((l) => l.seasonActive);

export async function teamMap() {
  return new Map((await getTeams()).map((t) => [t.id, t]));
}

export const getLeague = (slug: string) => getOne<League>("leagues", slug);
export const getTeam = (slug: string) => getOne<Team>("teams", slug);
export const getPlayer = (slug: string) => getOne<Player>("players", slug);
export const getMatch = (id: string) => getOne<Match>("matches", id);

export async function getLeagueMatches(leagueId: string) {
  return (await getAll<Match>("matches", where("leagueId", "==", leagueId))).sort((a, b) => a.round - b.round || byDate(a, b));
}
export async function getTeamMatches(teamId: string) {
  return (await getAll<Match>("matches", where("teamIds", "array-contains", teamId))).sort(byDate);
}
export async function getPlayerMatches(playerId: string) {
  return (await getAll<Match>("matches", where("playerIds", "array-contains", playerId))).sort((a, b) => b.date.getTime() - a.date.getTime());
}
export async function getTeamPlayers(teamId: string) {
  return (await getAll<Player>("players", where("teamId", "==", teamId))).sort((a, b) => (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99));
}
/** Aktif sezonun tüm maçları (fikstür, ana sayfa) */
export const getSeasonMatches = () => cached("seasonMatches", async () => {
  const leagues = await getActiveLeagues();
  const all = await Promise.all(leagues.map((l) => getLeagueMatches(l.id)));
  return all.flat().sort(byDate);
}, 30_000);

export const getPlayers = () => cached("players", () => getAll<Player>("players"), 120_000);

// ───────────── Başvurular ─────────────

export const getPeriods = () => cached("periods", async () => (await getAll<Period>("periods", where("isPublished", "==", true))).sort((a, b) => b.endDate.getTime() - a.endDate.getTime()));
export const getPeriod = (slug: string) => getOne<Period>("periods", slug);
export const getAppStatus = (code: string) => getOne<AppStatus>("applicationStatus", code);

// ───────────── Müzik ─────────────

export async function getCurrentCompetition() {
  const list = await getAll<MusicCompetition>("musicCompetitions", where("isCurrent", "==", true), qlimit(1));
  return list[0] ?? null;
}
export async function getCompetitionData(competitionId: string) {
  const [contestants, rounds] = await Promise.all([
    getAll<MusicContestant>("musicContestants", where("competitionId", "==", competitionId)),
    getAll<MusicRound>("musicRounds", where("competitionId", "==", competitionId)),
  ]);
  rounds.sort((a, b) => a.order - b.order);
  return { contestants, rounds };
}
export async function voteCount(contestantId: string) {
  return countOf("votes", where("contestantId", "==", contestantId));
}
export async function withVotes(list: MusicContestant[]) {
  const counts = await Promise.all(list.map((c) => (c.status === "ELIMINATED" ? Promise.resolve(0) : voteCount(c.id).catch(() => 0))));
  return list.map((c, i) => ({ ...c, votes: counts[i] }));
}
export const getContestant = (slug: string) => getOne<MusicContestant>("musicContestants", slug);

// ───────────── Tiyatro ─────────────

export async function getCurrentFestival() {
  const list = await getAll<TheatreFestival>("theatreFestivals", where("isCurrent", "==", true), qlimit(1));
  return list[0] ?? null;
}
export const getFestivals = () => getAll<TheatreFestival>("theatreFestivals");
export async function getFestivalPlays(festivalId: string) {
  return (await getAll<TheatrePlay>("theatrePlays", where("festivalId", "==", festivalId))).sort((a, b) => a.title.localeCompare(b.title, "tr"));
}
export const getPlay = (slug: string) => getOne<TheatrePlay>("theatrePlays", slug);
export const getGroup = (slug: string) => getOne<TheatreGroup>("theatreGroups", slug);
export const getGroupPlays = (groupId: string) => getAll<TheatrePlay>("theatrePlays", where("groupId", "==", groupId));

// ───────────── Genç Kalemler ─────────────

export const getWritingContests = async () => (await getAll<WritingContest>("writingContests")).sort((a, b) => b.deadline.getTime() - a.deadline.getTime());
export async function getCurrentWritingContest() {
  const list = await getAll<WritingContest>("writingContests", where("isCurrent", "==", true), qlimit(1));
  return list[0] ?? null;
}

// ───────────── İçerik ─────────────

export const getAnnouncements = () => cached("announcements", async () =>
  (await getAll<Announcement>("announcements", where("isPublished", "==", true)))
    .filter((a) => a.publishedAt <= new Date())
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.publishedAt.getTime() - a.publishedAt.getTime()));
export const getAnnouncement = (slug: string) => getOne<Announcement>("announcements", slug);
export const getVideos = () => cached("videos", async () => (await getAll<Video>("videos")).sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.publishedAt.getTime() - a.publishedAt.getTime()));
export const getGroups = () => cached("groups", async () => (await getAll<TheatreGroup>("theatreGroups")).sort((a, b) => a.name.localeCompare(b.name, "tr")));
