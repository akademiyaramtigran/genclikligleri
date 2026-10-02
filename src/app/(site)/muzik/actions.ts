"use server";

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/utils";

export type VoteState = { ok: boolean; message: string } | null;

/** Halk oylaması: her cihaz/bağlantı günde bir oy kullanabilir */
export async function voteAction(_prev: VoteState, formData: FormData): Promise<VoteState> {
  const contestantId = String(formData.get("contestantId") ?? "");
  const contestant = await db.musicContestant.findUnique({ where: { id: contestantId }, include: { competition: true } });
  if (!contestant) return { ok: false, message: "Yarışmacı bulunamadı." };
  if (!contestant.competition.votingOpen) return { ok: false, message: "Oylama şu anda kapalı." };
  if (contestant.status === "ELIMINATED") return { ok: false, message: "Bu yarışmacı yarışmadan elendi." };

  const h = await headers();
  const store = await cookies();
  let device = store.get("dgl_voter")?.value;
  if (!device) {
    device = crypto.randomUUID();
    store.set("dgl_voter", device, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/" });
  }
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const salt = process.env.AUTH_SECRET ?? "dgl";
  const today = dayKey();
  const hashes = [
    createHash("sha256").update(`${salt}:dev:${device}`).digest("hex"),
    createHash("sha256").update(`${salt}:ip:${ip}:${h.get("user-agent") ?? ""}`).digest("hex"),
  ];
  const existing = await db.musicVote.findFirst({ where: { dayKey: today, voterHash: { in: hashes } } });
  if (existing) return { ok: false, message: "Bugün oyunu kullandın. Yarın tekrar oy verebilirsin! 💜" };

  try {
    await db.musicVote.create({ data: { contestantId, voterHash: hashes[0]!, dayKey: today } });
    await db.musicVote.create({ data: { contestantId, voterHash: hashes[1]!, dayKey: `${today}#ip` } }).catch(() => {});
  } catch {
    return { ok: false, message: "Bugün oyunu kullandın. Yarın tekrar oy verebilirsin! 💜" };
  }
  revalidatePath("/muzik");
  return { ok: true, message: `Oyun ${contestant.name} için kaydedildi. Teşekkürler!` };
}
