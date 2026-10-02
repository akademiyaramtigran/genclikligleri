/* Canlı ortam ilk açılışı: veritabanı boşsa demo verisini yükler, doluysa hiçbir şeye dokunmaz. */
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const db = new PrismaClient();

async function main() {
  const users = await db.user.count();
  await db.$disconnect();
  if (users > 0) {
    console.log("✓ Veritabanı dolu, demo verisi yüklenmedi.");
    return;
  }
  console.log("Veritabanı boş — demo verisi yükleniyor…");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
