import { db } from "@/lib/db";
import { getCurrentUser, canAccess, type Unit } from "@/lib/auth";
import { readDocument } from "@/lib/storage";

/** Başvuru belgeleri yalnızca yetkili yöneticilere sunulur */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Yetkisiz", { status: 401 });
  const { id } = await params;
  const doc = await db.applicationDocument.findUnique({ where: { id }, include: { application: { include: { period: true } } } });
  if (!doc) return new Response("Bulunamadı", { status: 404 });
  if (!canAccess(user, doc.application.period.category as Unit)) return new Response("Yetkisiz", { status: 403 });
  try {
    const buf = await readDocument(doc.storedName);
    const inline = doc.mimeType === "application/pdf" || doc.mimeType.startsWith("image/");
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Dosya depoda bulunamadı", { status: 404 });
  }
}
