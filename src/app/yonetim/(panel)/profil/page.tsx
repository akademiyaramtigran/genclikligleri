"use client";

import { useAdmin } from "../../AdminContext";
import { ROLES, SCOPES } from "@/lib/constants";
import { KeyValue } from "@/components/ui";
import { AdminHeader, Panel, TextField } from "@/components/admin/fields";
import { AdminForm } from "@/components/admin/AdminForm";
import { changePassword } from "@/actions/genel";


export default function ProfilePage() {
  const user = useAdmin();
  return (
    <>
      <AdminHeader title="Profil" />
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <Panel title="Hesap"><KeyValue items={[["Ad", user.name], ["E-posta", user.email], ["Rol", ROLES[user.role]], ["Yetki", SCOPES[user.scope]]]} /></Panel>
        <Panel title="Şifre Değiştir">
          <AdminForm action={changePassword} resetOnSuccess submitLabel="Şifreyi Değiştir">
            <div className="space-y-3">
              <TextField label="Mevcut Şifre" name="current" type="password" required autoComplete="current-password" />
              <TextField label="Yeni Şifre" name="next" type="password" required autoComplete="new-password" />
              <TextField label="Yeni Şifre (tekrar)" name="again" type="password" required autoComplete="new-password" />
            </div>
          </AdminForm>
        </Panel>
      </div>
    </>
  );
}
