"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/client";

/** Eski adres: /spor/krallik → /spor/istatistik (paylaşılmış bağlantılar bozulmasın) */
export default function OldStatsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace(`/spor/istatistik${window.location.search}`); }, [router]);
  return <PageLoader />;
}
