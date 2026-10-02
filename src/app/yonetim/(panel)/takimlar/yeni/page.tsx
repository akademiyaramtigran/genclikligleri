import { requireUser } from "@/lib/auth";
import { AdminHeader, Panel } from "@/components/admin/fields";
import { TeamForm } from "../TeamForm";

export default async function NewTeam({ searchParams }: { searchParams: Promise<{ lig?: string }> }) {
  await requireUser("SPOR");
  const { lig } = await searchParams;
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/takimlar", label: "Takımlar" }} title="Yeni Takım" />
      <Panel><TeamForm leagueId={lig} /></Panel>
    </>
  );
}
