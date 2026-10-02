import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminNav } from "../AdminNav";

export const metadata: Metadata = { title: { default: "Yönetim", template: "%s | Yönetim" }, robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [pending, messages] = await Promise.all([
    db.application.count({ where: { status: { in: ["PENDING", "IN_REVIEW"] } } }),
    db.contactMessage.count({ where: { isRead: false } }),
  ]);
  return (
    <div className="min-h-screen bg-basalt-100/60">
      <AdminNav user={{ name: user.name, role: user.role, scope: user.scope }} counts={{ pending, messages }} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
