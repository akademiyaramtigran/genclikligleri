"use client";

import Link from "next/link";
import { AdminHeader } from "@/components/admin/fields";
import { Suspended, useParam } from "@/components/client";
import { PeriodForm } from "../PeriodForm";
import { CATEGORIES } from "@/lib/constants";

export default function NewPeriod() {
  return <Suspended><Inner /></Suspended>;
}

function Inner() {
  const kategori = useParam("kategori");
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/donemler", label: "Dönemler" }} title="Yeni Başvuru Dönemi" description={<span>Varsayılan belge listesi için kategori seçin: {Object.values(CATEGORIES).map((c) => <Link key={c.key} href={`/yonetim/donemler/yeni?kategori=${c.key}`} className="link mx-1">{c.label}</Link>)}</span>} />
      <PeriodForm key={kategori} category={kategori} />
    </>
  );
}
