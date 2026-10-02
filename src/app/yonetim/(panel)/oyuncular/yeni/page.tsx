"use client";

import { AdminHeader, Panel } from "@/components/admin/fields";
import { Suspended, useParam } from "@/components/client";
import { RequireUnit } from "../../../AdminContext";
import { PlayerForm } from "../PlayerForm";

export default function NewPlayer() {
  return <RequireUnit unit="SPOR"><Suspended><Inner /></Suspended></RequireUnit>;
}

function Inner() {
  const takim = useParam("takim");
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/oyuncular", label: "Oyuncular" }} title="Yeni Oyuncu" />
      <Panel><PlayerForm teamId={takim} /></Panel>
    </>
  );
}
