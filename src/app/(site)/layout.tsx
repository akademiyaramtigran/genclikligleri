import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { db } from "@/lib/db";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const now = new Date();
  const openPeriods = await db.applicationPeriod.count({ where: { isPublished: true, startDate: { lte: now }, endDate: { gte: now } } });
  return (
    <>
      <Header openPeriods={openPeriods} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
    </>
  );
}
