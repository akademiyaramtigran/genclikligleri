import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/fields";
import { PeriodForm } from "../PeriodForm";
import { CATEGORIES } from "@/lib/constants";

export default async function NewPeriod({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  await requireUser();
  const { kategori } = await searchParams;
  return (
    <>
      <AdminHeader back={{ href: "/yonetim/donemler", label: "Dönemler" }} title="Yeni Başvuru Dönemi" description={<span>Varsayılan belge listesi için kategori seçin: {Object.values(CATEGORIES).map((c) => <Link key={c.key} href={`?kategori=${c.key}`} className="link mx-1">{c.label}</Link>)}</span>} />
      <PeriodForm key={kategori} category={kategori} />
    </>
  );
}
