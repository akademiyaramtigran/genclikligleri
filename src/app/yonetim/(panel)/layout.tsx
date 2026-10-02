"use client";

import { where } from "firebase/firestore";
import { countOf } from "@/lib/data";
import { useData } from "@/lib/hooks";
import { AdminNav } from "../AdminNav";
import { AdminGate, useAdmin } from "../AdminContext";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <Shell>{children}</Shell>
    </AdminGate>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const admin = useAdmin();
  const { data } = useData(async () => {
    const [pending, review, messages] = await Promise.all([
      countOf("applications", where("status", "==", "PENDING")).catch(() => 0),
      countOf("applications", where("status", "==", "IN_REVIEW")).catch(() => 0),
      countOf("messages", where("isRead", "==", false)).catch(() => 0),
    ]);
    return { pending: pending + review, messages };
  }, []);
  return (
    <div className="min-h-screen bg-basalt-100/60">
      <AdminNav user={{ name: admin.name, role: admin.role, scope: admin.scope }} counts={data ?? { pending: 0, messages: 0 }} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
