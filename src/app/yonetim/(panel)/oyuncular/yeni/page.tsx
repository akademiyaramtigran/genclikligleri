import { requireUser } from "@/lib/auth";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { PlayerForm } from "../PlayerForm";

export default async function NewPlayer({ searchParams }: { searchParams: Promise<{ takim?: string }> }) {
  await requireUser("SPOR");
  const { takim } = await searchParams;
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/oyuncular", label: "Oyuncular" }} title="Yeni Oyuncu" />
      <Panel><PlayerForm teamId={takim} /></Panel>
    </>
  );
}
