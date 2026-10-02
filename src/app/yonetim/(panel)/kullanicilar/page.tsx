import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { ROLES, SCOPES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { AdminHeader, CheckField, FormGrid, Panel, SelectField, TextField } from "@/components/admin/fields";
import { AdminForm, ActionButton } from "@/components/admin/AdminForm";
import { deleteUser, saveUser } from "@/actions/genel";

export const metadata: Metadata = { title: "Kullanıcılar" };

function UserFields({ u }: { u?: User }) {
  return (
    <div className="space-y-3">
      {u && <input type="hidden" name="id" value={u.id} />}
      <FormGrid><TextField label="Ad Soyad" name="name" required defaultValue={u?.name} /><TextField label="E-posta" name="email" type="email" required defaultValue={u?.email} autoComplete="off" /></FormGrid>
      <FormGrid><SelectField label="Rol" name="role" defaultValue={u?.role} options={ROLES} /><SelectField label="Yetki Alanı" name="scope" defaultValue={u?.scope} options={SCOPES} /></FormGrid>
      <TextField label={u ? "Yeni Şifre (değiştirmek için)" : "Şifre"} name="password" type="password" required={!u} autoComplete="new-password" hint="En az 8 karakter." />
      {u && <CheckField label="Hesap aktif" name="active" defaultChecked={u.active} />}
    </div>
  );
}

export default async function UsersAdmin() {
  const me = await requireSuperAdmin();
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <>
      <AdminHeader title="Kullanıcılar" description="Birim koordinatörleri yalnızca kendi alanlarını (Spor / Müzik / Tiyatro) yönetebilir." />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-3">
          {users.map((u) => (
            <details key={u.id} className="card">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
                <span className="flex-1"><span className="block font-semibold">{u.name} {u.id === me.id && <span className="text-xs text-basalt-400">(siz)</span>}</span><span className="text-xs text-basalt-500">{u.email} · Son giriş: {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}</span></span>
                <Badge tone={u.role === "SUPER_ADMIN" ? "violet" : "blue"}>{ROLES[u.role]}</Badge>
                <Badge>{SCOPES[u.scope]}</Badge>
                {!u.active && <Badge tone="red">Pasif</Badge>}
              </summary>
              <div className="border-t border-basalt-100 p-4">
                <AdminForm action={saveUser} compact><UserFields u={u} /></AdminForm>
                {u.id !== me.id && <div className="mt-2"><ActionButton action={deleteUser} fields={{ id: u.id }} label="Kullanıcıyı sil" icon={<Trash2 className="h-3.5 w-3.5" />} confirm="Kullanıcı silinsin mi?" className="btn-ghost btn-sm text-red-600" /></div>}
              </div>
            </details>
          ))}
        </div>
        <Panel title="Yeni Kullanıcı"><AdminForm action={saveUser} submitLabel="Oluştur" resetOnSuccess><UserFields /></AdminForm></Panel>
      </div>
    </>
  );
}
