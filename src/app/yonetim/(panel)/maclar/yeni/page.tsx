"use client";

import { AdminHeader, Panel } from "@/components/admin/fields";
import { Suspended, useParam } from "@/components/client";
import { RequireUnit } from "../../../AdminContext";
import { MatchForm } from "../MatchForm";

export default function NewMatch() {
  return <RequireUnit unit="SPOR"><Suspended><Inner /></Suspended></RequireUnit>;
}

function Inner() {
  const lig = useParam("lig");
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/maclar", label: "Maçlar" }} title="Yeni Maç" description="Toplu fikstür için lig sayfasındaki otomatik fikstür aracını kullanabilirsiniz." />
      <Panel><MatchForm key={lig} leagueId={lig} /></Panel>
    </>
  );
}
