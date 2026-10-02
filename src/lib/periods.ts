export type PeriodState = "UPCOMING" | "OPEN" | "CLOSED";

export function periodState(p: { startDate: Date; endDate: Date }, now = new Date()): PeriodState {
  if (now < p.startDate) return "UPCOMING";
  if (now > p.endDate) return "CLOSED";
  return "OPEN";
}

export const PERIOD_STATE_LABEL: Record<PeriodState, { label: string; tone: string }> = {
  UPCOMING: { label: "Yakında Açılacak", tone: "amber" },
  OPEN: { label: "Başvurular Açık", tone: "green" },
  CLOSED: { label: "Başvurular Kapandı", tone: "zinc" },
};

export function daysLeft(end: Date, now = new Date()) {
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}
