"use client";

// Takvime ekle: standart .ics dosyası (Google Takvim, Apple Takvim, Outlook açar)

export type CalEvent = { uid: string; title: string; start: Date; minutes?: number; location?: string | null; description?: string | null; url?: string | null };

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

export function buildIcs(events: CalEvent[]) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Diyarbakir Genclik Organizasyonlari//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const e of events) {
    const end = new Date(e.start.getTime() + (e.minutes ?? 120) * 60000);
    lines.push("BEGIN:VEVENT", `UID:${e.uid}@genclik-diyarbakir`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${esc(e.title)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.description || e.url) lines.push(`DESCRIPTION:${esc([e.description, e.url].filter(Boolean).join("\n"))}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push("BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.title)}`, "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(events: CalEvent[], filename: string) {
  const blob = new Blob([buildIcs(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
