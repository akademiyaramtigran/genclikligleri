// Bölüm amblemleri: Ligler (Üç Kemer), Genç Sesler (müzik), Tiyatro (maske), Genç Kalemler (kalem ucu)

type MarkProps = { size?: number; className?: string; light?: boolean };

/** Üç Kemer — On Gözlü Köprü'nün kemerleri ve Dicle. Spor / lig alanlarının amblemi. */
export function ArchMark({ size = 40, className, light }: MarkProps) {
  const c = light ? ["#0d9488", "#c026d3", "#d97706", "#0369a1"] : ["#2dd4bf", "#e879f9", "#fbbf24", "#7dd3fc"];
  return (
    <svg width={size * 1.3} height={size} viewBox="0 0 130 100" aria-hidden className={className}>
      <path d="M8 70 A21 21 0 0 1 50 70" fill="none" stroke={c[0]} strokeWidth="10" strokeLinecap="round" />
      <path d="M44 70 A21 21 0 0 1 86 70" fill="none" stroke={c[1]} strokeWidth="10" strokeLinecap="round" />
      <path d="M80 70 A21 21 0 0 1 122 70" fill="none" stroke={c[2]} strokeWidth="10" strokeLinecap="round" />
      <path d="M6 86 Q20 80 34 86 T62 86 T90 86 T124 86" fill="none" stroke={c[3]} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Üç Kemer, kutu içinde (başlık çubuğu ve favicon boyutları için) */
export function ArchBadge({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <rect x="0.5" y="0.5" width="39" height="39" rx="11" fill="#0b1f2a" stroke="rgba(255,255,255,.12)" />
      <g transform="translate(4 6) scale(0.246)">
        <path d="M8 70 A21 21 0 0 1 50 70" fill="none" stroke="#2dd4bf" strokeWidth="12" strokeLinecap="round" />
        <path d="M44 70 A21 21 0 0 1 86 70" fill="none" stroke="#e879f9" strokeWidth="12" strokeLinecap="round" />
        <path d="M80 70 A21 21 0 0 1 122 70" fill="none" stroke="#fbbf24" strokeWidth="12" strokeLinecap="round" />
        <path d="M6 88 Q20 81 34 88 T62 88 T90 88 T124 88" fill="none" stroke="#7dd3fc" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Genç Sesler — ses dalgası çubukları */
export function MusicBadge({ size = 38 }: { size?: number }) {
  const bars = [10, 18, 26, 16, 22, 12];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="mus-g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#a855f7" /><stop offset="1" stopColor="#f0abfc" /></linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="39" height="39" rx="11" fill="#1a0b2e" stroke="rgba(232,121,249,.35)" />
      {bars.map((h, i) => <rect key={i} x={7 + i * 4.6} y={20 - h / 2} width="2.8" height={h} rx="1.4" fill="url(#mus-g)" />)}
    </svg>
  );
}

/** Tiyatro — bazalt üzerinde gül kırmızısı maske */
export function StageBadge({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <rect x="0.5" y="0.5" width="39" height="39" rx="11" fill="#0c0c0e" stroke="rgba(244,63,94,.45)" />
      <path d="M9 9.5 Q20 6 31 9.5 V19 Q31 31.5 20 34 Q9 31.5 9 19 Z" fill="#f43f5e" />
      <path d="M12.5 16.5 Q15 14 17.5 16.5 Q15 18 12.5 16.5 Z M22.5 16.5 Q25 14 27.5 16.5 Q25 18 22.5 16.5 Z" fill="#0c0c0e" />
      <path d="M14 24 Q20 29.5 26 24" fill="none" stroke="#0c0c0e" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Genç Kalemler — kalem ucu */
export function PenMark({ size = 40, className, color = "#f43f5e" }: { size?: number; className?: string; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className={className}>
      <path d="M20 3 L30 17 L24 33 H16 L10 17 Z" fill={color} />
      <path d="M20 13 V24" stroke="#0c0c0e" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="25.5" r="2.4" fill="#0c0c0e" />
      <rect x="15" y="34" width="10" height="3.5" rx="1" fill={color} />
    </svg>
  );
}
