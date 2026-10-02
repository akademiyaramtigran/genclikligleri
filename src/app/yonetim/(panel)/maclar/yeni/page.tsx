import { requireUser } from "@/lib/auth";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { MatchForm } from "../MatchForm";

export default async function NewMatch({ searchParams }: { searchParams: Promise<{ lig?: string }> }) {
  await requireUser("SPOR");
  const { lig } = await searchParams;
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/maclar", label: "Maçlar" }} title="Yeni Maç" description="Toplu fikstür için lig sayfasındaki otomatik fikstür aracını kullanabilirsiniz." />
      <Panel><MatchForm leagueId={lig} /></Panel>
    </>
  );
}
