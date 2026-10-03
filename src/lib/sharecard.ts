"use client";

// Sosyal medya için paylaşım görselleri (1080×1350, Instagram dikey gönderi)

import type { Highlight, Match, StandingRow, TeamRef } from "./types";
import { sportDef } from "./constants";
import { formatDate, formatTime } from "./utils";

const W = 1080, H = 1350;

function font(varName: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function setup() {
  await document.fonts?.ready;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d")!;
  return { c, x, display: font("--font-oswald", "Impact, sans-serif"), body: font("--font-inter", "system-ui, sans-serif") };
}

/** Bazalt duvar deseni + renk ışıkları */
function background(x: CanvasRenderingContext2D, accent = "#14b8a6") {
  x.fillStyle = "#0a0d15"; x.fillRect(0, 0, W, H);
  const g1 = x.createRadialGradient(150, 200, 0, 150, 200, 700); g1.addColorStop(0, accent + "55"); g1.addColorStop(1, "transparent");
  x.fillStyle = g1; x.fillRect(0, 0, W, H);
  const g2 = x.createRadialGradient(W - 100, H - 250, 0, W - 100, H - 250, 650); g2.addColorStop(0, "#d946ef40"); g2.addColorStop(1, "transparent");
  x.fillStyle = g2; x.fillRect(0, 0, W, H);
  x.strokeStyle = "rgba(255,255,255,.04)"; x.lineWidth = 3;
  for (let yy = 0; yy < H; yy += 72) { x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
  for (let row = 0; row * 72 < H; row++) for (let xx = (row % 2) * 72; xx < W; xx += 144) { x.beginPath(); x.moveTo(xx, row * 72); x.lineTo(xx, row * 72 + 72); x.stroke(); }
}

/** Üç Kemer amblemi ve alt bilgi */
function brand(x: CanvasRenderingContext2D, body: string, display: string) {
  const s = 0.62, ox = 70, oy = H - 120;
  const arcs: [number, string][] = [[29, "#2dd4bf"], [65, "#e879f9"], [101, "#fbbf24"]];
  x.lineWidth = 10 * s; x.lineCap = "round";
  for (const [cx, col] of arcs) { x.strokeStyle = col; x.beginPath(); x.arc(ox + cx * s, oy + 70 * s, 21 * s, Math.PI, 0); x.stroke(); }
  x.strokeStyle = "#7dd3fc"; x.lineWidth = 4 * s; x.beginPath(); x.moveTo(ox + 6 * s, oy + 86 * s);
  x.quadraticCurveTo(ox + 20 * s, oy + 80 * s, ox + 34 * s, oy + 86 * s); x.quadraticCurveTo(ox + 48 * s, oy + 92 * s, ox + 62 * s, oy + 86 * s);
  x.quadraticCurveTo(ox + 76 * s, oy + 80 * s, ox + 90 * s, oy + 86 * s); x.quadraticCurveTo(ox + 104 * s, oy + 92 * s, ox + 124 * s, oy + 86 * s); x.stroke();
  x.fillStyle = "#fff"; x.font = `600 34px ${display}`; x.textAlign = "left"; x.fillText("GENÇLİK LİGLERİ", ox + 100, oy + 50);
  x.fillStyle = "rgba(255,255,255,.55)"; x.font = `500 22px ${body}`; x.fillText("Diyarbakır Gençlik Organizasyonları", ox + 100, oy + 82);
}

async function crest(x: CanvasRenderingContext2D, t: TeamRef, cx: number, cy: number, r: number, display: string) {
  x.save();
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2);
  if (t.logoUrl) {
    x.fillStyle = "#fff"; x.fill(); x.clip();
    const img = await loadImage(t.logoUrl);
    if (img) {
      const pad = r * 0.2, box = (r - pad) * 2, k = Math.min(box / img.width, box / img.height);
      x.drawImage(img, cx - (img.width * k) / 2, cy - (img.height * k) / 2, img.width * k, img.height * k);
    }
  } else {
    x.fillStyle = t.primaryColor || "#0f766e"; x.fill();
    x.lineWidth = r * 0.12; x.strokeStyle = t.secondaryColor || "#fff"; x.stroke();
    x.fillStyle = t.secondaryColor || "#fff"; x.font = `700 ${r * 0.7}px ${display}`; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText((t.shortName || t.name).slice(0, 3).toLocaleUpperCase("tr-TR"), cx, cy + r * 0.04);
  }
  x.restore();
}

function wrapText(x: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/); const lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}

const toBlob = (c: HTMLCanvasElement) => new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png"));

/** Maç sonucu / maç günü kartı */
export async function matchCard(m: Match) {
  const { c, x, display, body } = await setup();
  background(x, m.gender === "KADIN" ? "#f43f5e" : "#14b8a6");
  const def = sportDef(m.sport);
  const done = m.status === "FINISHED";
  x.textAlign = "center";
  x.fillStyle = "#2dd4bf"; x.font = `700 30px ${body}`;
  x.fillText((done ? "MAÇ SONUCU" : "MAÇ GÜNÜ").split("").join(String.fromCharCode(8202)), W / 2, 150);
  x.fillStyle = "rgba(255,255,255,.75)"; x.font = `500 30px ${body}`; x.fillText(`${def.emoji} ${m.leagueName} · ${m.round}. Hafta`, W / 2, 205);
  await crest(x, m.home, 270, 520, 150, display);
  await crest(x, m.away, W - 270, 520, 150, display);
  x.fillStyle = "#fff"; x.font = `600 40px ${display}`;
  for (const [t, cx] of [[m.home, 270], [m.away, W - 270]] as const) wrapText(x, t.name.toLocaleUpperCase("tr-TR"), 360).slice(0, 2).forEach((l, i) => x.fillText(l, cx, 730 + i * 48));
  if (done) {
    x.font = `700 230px ${display}`; x.fillStyle = "#fff"; x.fillText(`${m.homeScore ?? 0}`, W / 2 - 150, 1010); x.fillText(`${m.awayScore ?? 0}`, W / 2 + 150, 1010);
    x.fillStyle = "rgba(255,255,255,.35)"; x.fillText("-", W / 2, 990);
  } else {
    x.font = `700 160px ${display}`; x.fillStyle = "#fff"; x.fillText(formatTime(m.date), W / 2, 980);
    x.font = `500 36px ${body}`; x.fillStyle = "rgba(255,255,255,.75)"; x.fillText(formatDate(m.date, { weekday: "long", day: "numeric", month: "long" }), W / 2, 1045);
  }
  x.font = `500 28px ${body}`; x.fillStyle = "rgba(255,255,255,.6)";
  x.fillText([done ? formatDate(m.date) : null, m.venueName].filter(Boolean).join(" · "), W / 2, done ? 1090 : 1100);
  brand(x, body, display);
  return toBlob(c);
}

/** Puan durumu kartı (ilk 8) */
export async function standingsCard(title: string, rows: StandingRow[], sport: string) {
  const { c, x, display, body } = await setup();
  background(x);
  const def = sportDef(sport);
  x.textAlign = "left";
  x.fillStyle = "#2dd4bf"; x.font = `700 28px ${body}`; x.fillText("PUAN DURUMU", 70, 130);
  x.fillStyle = "#fff"; x.font = `600 62px ${display}`;
  wrapText(x, `${def.emoji} ${title}`.toLocaleUpperCase("tr-TR"), W - 140).slice(0, 2).forEach((l, i) => x.fillText(l, 70, 210 + i * 70));
  const top = 340, rowH = 100;
  x.font = `600 24px ${body}`; x.fillStyle = "rgba(255,255,255,.5)";
  x.textAlign = "center"; ["O", "AV", "P"].forEach((h, i) => x.fillText(h, 760 + i * 110, top - 20));
  for (const [i, r] of rows.slice(0, 8).entries()) {
    const y = top + i * rowH;
    x.fillStyle = i % 2 ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.07)"; x.fillRect(50, y, W - 100, rowH - 10);
    if (i === 0) { x.fillStyle = "#2dd4bf"; x.fillRect(50, y, 8, rowH - 10); }
    x.textAlign = "center"; x.fillStyle = "rgba(255,255,255,.6)"; x.font = `700 40px ${display}`; x.fillText(String(r.position), 110, y + 60);
    await crest(x, r, 190, y + 45, 32, display);
    x.textAlign = "left"; x.fillStyle = "#fff"; x.font = `600 36px ${body}`;
    let name = r.name; while (x.measureText(name).width > 440 && name.length > 4) name = name.slice(0, -2) + "…";
    x.fillText(name, 240, y + 58);
    x.textAlign = "center"; x.font = `600 34px ${body}`; x.fillStyle = "rgba(255,255,255,.75)";
    x.fillText(String(r.played), 760, y + 58); x.fillText(`${r.diff > 0 ? "+" : ""}${r.diff}`, 870, y + 58);
    x.fillStyle = "#fff"; x.font = `700 44px ${display}`; x.fillText(String(r.points), 980, y + 60);
  }
  x.textAlign = "left"; x.font = `500 24px ${body}`; x.fillStyle = "rgba(255,255,255,.45)"; x.fillText(formatDate(new Date()), 70, H - 160);
  brand(x, body, display);
  return toBlob(c);
}

/** Haftanın oyuncusu / sanatçısı / centilmenlik kartı */
export async function highlightCard(h: Highlight, label: string) {
  const { c, x, display, body } = await setup();
  background(x, h.kind === "ARTIST" ? "#d946ef" : h.kind === "FAIRPLAY" ? "#f59e0b" : "#14b8a6");
  if (h.photoUrl) {
    const img = await loadImage(h.photoUrl);
    if (img) {
      const bw = W - 140, bh = 640, k = Math.max(bw / img.width, bh / img.height);
      x.save(); x.beginPath(); x.roundRect(70, 110, bw, bh, 40); x.clip();
      x.drawImage(img, 70 + (bw - img.width * k) / 2, 110 + (bh - img.height * k) / 2, img.width * k, img.height * k); x.restore();
    }
  }
  const y0 = h.photoUrl ? 820 : 260;
  x.textAlign = "left"; x.fillStyle = h.kind === "ARTIST" ? "#f0abfc" : h.kind === "FAIRPLAY" ? "#fcd34d" : "#5eead4"; x.font = `700 30px ${body}`; x.fillText(label.toLocaleUpperCase("tr-TR"), 70, y0);
  x.fillStyle = "#fff"; x.font = `600 84px ${display}`;
  const nameLines = wrapText(x, h.name.toLocaleUpperCase("tr-TR"), W - 140).slice(0, 2);
  nameLines.forEach((l, i) => x.fillText(l, 70, y0 + 95 + i * 90));
  let y = y0 + 95 + nameLines.length * 90;
  if (h.subtitle) { x.font = `500 32px ${body}`; x.fillStyle = "rgba(255,255,255,.75)"; x.fillText(h.subtitle, 70, y); y += 60; }
  x.font = `400 30px ${body}`; x.fillStyle = "rgba(255,255,255,.85)";
  wrapText(x, h.story, W - 140).slice(0, h.photoUrl ? 3 : 10).forEach((l, i) => x.fillText(l, 70, y + i * 44));
  brand(x, body, display);
  return toBlob(c);
}

/** Görseli paylaş (mobilde paylaşım menüsü) ya da indir */
export async function shareOrDownload(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return; } catch { /* iptal → indir */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
