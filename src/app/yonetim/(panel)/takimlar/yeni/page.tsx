"use client";

import { AdminHeader, Panel } from "@/components/admin/fields";
import { Suspended, useParam } from "@/components/client";
import { RequireUnit } from "../../../AdminContext";
import { TeamForm } from "../TeamForm";

export default function NewTeam() {
  return <RequireUnit unit="SPOR"><Suspended><Inner /></Suspended></RequireUnit>;
}

function Inner() {
  const lig = useParam("lig");
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/takimlar", label: "Takımlar" }} title="Yeni Takım" />
      <Panel><TeamForm leagueId={lig} /></Panel>
    </>
  );
}
