import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { SITE } from "@/lib/constants";
import { PageHero } from "@/components/ui";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "İletişim" };

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Bize Ulaşın" title="İletişim" description="Soru, öneri, gönüllülük ve sponsorluk talepleriniz için bize yazın." />
      <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_22rem]">
        <ContactForm />
        <aside className="card h-fit space-y-4 p-6 text-sm">
          <p className="flex items-start gap-3"><MapPin className="h-5 w-5 shrink-0 text-dicle-600" /> {SITE.address}</p>
          <p className="flex items-center gap-3"><Phone className="h-5 w-5 text-dicle-600" /> {SITE.phone}</p>
          <p className="flex items-center gap-3"><Mail className="h-5 w-5 text-dicle-600" /> {SITE.email}</p>
          <p className="flex items-center gap-3"><Clock className="h-5 w-5 text-dicle-600" /> Hafta içi 09:00 – 18:00</p>
        </aside>
      </div>
    </>
  );
}
