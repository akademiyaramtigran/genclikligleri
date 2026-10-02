import { ScoreTicker } from "@/components/sport";

/** Spor alanının ortak düzeni: üstte canlı / son skor bandı */
export default function SportLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScoreTicker />
      {children}
    </>
  );
}
