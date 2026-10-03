"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, FileUp, Loader2, Plus, Trash2, Upload, UserPlus, Copy } from "lucide-react";
import { submitApplication, type ApplyState, type Member } from "@/actions/public";
import { cn } from "@/lib/utils";
import { DISTRICTS, MUSIC_GENRES, THEATRE_GENRES, SPORTS, WRITING_CATEGORIES, WRITING_CATEGORY_HINT, WRITING_LANGUAGES, VOLUNTEER_ROLES, type SportKey } from "@/lib/constants";
import { MAX_DOC_MB as MAX_UPLOAD_MB, compressImage } from "@/lib/files";
import type { RequiredDoc } from "@/lib/types";

import { useT } from "@/lib/i18n";
type PeriodProps = {
  id: string;
  title: string;
  category: "SPOR" | "MUZIK" | "TIYATRO" | "YAZARLIK" | "GONULLU";
  sport?: string | null;
  gender?: string | null;
  minMembers?: number | null;
  maxMembers?: number | null;
  minAge?: number | null;
  maxAge?: number | null;
};

const STEPS = ["Başvuru Sahibi", "Bilgiler", "Kadro", "Belgeler", "Onay"];

export function ApplicationForm({ period, docs }: { period: PeriodProps; docs: RequiredDoc[] }) {
  const t = useT();
  const [state, action, pending] = useActionState<ApplyState, FormData>(submitApplication, null);
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const initialCount = Math.min(period.minMembers ?? 1, 3) || 1;
  const [members, setMembers] = useState<Member[]>(() => Array.from({ length: initialCount }, () => ({})));
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};
  const sportDef = period.sport ? SPORTS[period.sport as SportKey] : null;
  const isSport = period.category === "SPOR";
  const isWriting = period.category === "YAZARLIK";
  const isVolunteer = period.category === "GONULLU";
  const memberWord = isSport ? "Oyuncu" : isWriting ? "Yazar" : "Üye";

  useEffect(() => {
    if (state && !state.ok && state.fieldErrors) {
      const first = [0, 1, 2, 3, 4].find((i) => stepHasErrorFor(state.fieldErrors ?? {}, i));
      if (first != null) setStep(first);
    }
  }, [state]);

  if (state?.ok) {
    return (
      <div className="card overflow-hidden text-center">
        <div className="bg-gradient-to-br from-emerald-500 to-dicle-600 px-6 py-10 text-white">
          <CheckCircle2 className="mx-auto h-16 w-16" />
          <h2 className="mt-4 font-display text-3xl font-semibold uppercase">{t("Başvurunuz Alındı!")}</h2>
          <p className="mt-2 text-white/85">{period.title}</p>
        </div>
        <div className="p-8">
          <p className="text-sm text-basalt-500">{t("Başvuru takip kodunuz")}</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className="rounded-xl bg-basalt-900 px-6 py-3 font-mono text-3xl font-bold tracking-[0.2em] text-white">{state.trackingCode}</p>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(state.trackingCode); setCopied(true); }} className="btn-outline" aria-label={t("Kodu kopyala")}>
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mx-auto mt-4 max-w-md text-sm text-basalt-600">
            Bu kodu ve e-posta adresinizi (<strong>{state.email}</strong>) not edin. Başvurunuzun durumunu takip sayfasından sorgulayabilirsiniz.
            Organizasyon komitesi başvurunuzu inceledikten sonra sizinle iletişime geçecektir.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/basvuru/takip?kod=${state.trackingCode}`} className="btn-primary">{t("Başvuru Durumunu Gör")}</Link>
            <Link href="/basvuru" className="btn-outline">{t("Diğer Başvurular")}</Link>
          </div>
        </div>
      </div>
    );
  }

  const next = () => {
    const el = stepRefs.current[step];
    if (el) {
      const inputs = el.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea");
      for (const i of inputs) if (!i.checkValidity()) { i.reportValidity(); return; }
    }
    if (step === 2) {
      const filled = members.filter((m) => (m.firstName ?? "").trim() && (m.lastName ?? "").trim()).length;
      if (period.minMembers && filled < period.minMembers) { alert(`En az ${period.minMembers} ${memberWord.toLowerCase()} eklemelisiniz. (Şu an: ${filled})`); return; }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const setMember = (i: number, k: string, v: string) => setMembers((list) => list.map((m, idx) => (idx === i ? { ...m, [k]: v } : m)));

  const err = (k: string) => fe[k] && <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="h-3.5 w-3.5" /> {fe[k]}</p>;
  const stepHasError = (i: number) => stepHasErrorFor(fe, i);

  return (
    <form
      ref={formRef}
      // React'in otomatik form sıfırlamasını önlemek için manuel gönderim (hata durumunda veriler korunur)
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="card scroll-mt-32 overflow-hidden"
    >
      <input type="hidden" name="periodId" value={period.id} />
      <input type="hidden" name="members" value={JSON.stringify(members)} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {/* Adım göstergesi */}
      <ol className="flex border-b border-basalt-100 bg-basalt-50">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <button type="button" onClick={() => i < step && setStep(i)} className={cn("flex w-full flex-col items-center gap-1 px-1 py-3 text-[11px] font-semibold sm:flex-row sm:justify-center sm:gap-2 sm:text-xs", i === step ? "text-basalt-900" : i < step ? "text-dicle-700" : "text-basalt-400")}>
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs", stepHasError(i) ? "bg-red-500 text-white" : i < step ? "bg-dicle-500 text-white" : i === step ? "bg-basalt-900 text-white" : "bg-basalt-200 text-basalt-500")}>
                {i < step && !stepHasError(i) ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      {state && !state.ok && (
        <div className="m-6 mb-0 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
        </div>
      )}

      <div className="p-6 sm:p-8">
        {/* 1. Başvuru sahibi */}
        <div ref={(el) => { stepRefs.current[0] = el; }} className={cn("space-y-5", step !== 0 && "hidden")}>
          <StepTitle n={1} title={t("Başvuru Sahibi")} desc="Başvurudan sorumlu, 18 yaşını doldurmuş kişinin bilgileri." />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("Ad Soyad")} required>{<input name="applicantName" required minLength={3} className="input" autoComplete="name" />}{err("applicantName")}</Field>
            <Field label={t("Görevi")}>
              <select name="applicantRole" className="input">
                {(isSport ? ["Takım Sorumlusu", "Antrenör", "Kulüp Başkanı", "Öğretmen"] : period.category === "MUZIK" ? ["Solist", "Grup Sorumlusu", "Menajer", "Veli"] : isWriting ? ["Yazar", "Veli", "Öğretmen"] : isVolunteer ? ["Başvuran", "Veli"] : ["Yönetmen", "Topluluk Sorumlusu", "Öğretmen", "Yapımcı"]).map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label={t("E-posta")} required>{<input name="applicantEmail" type="email" required className="input" autoComplete="email" />}{err("applicantEmail")}</Field>
            <Field label={t("Telefon")} required>{<input name="applicantPhone" type="tel" required pattern={"[\\d\\s+\\(\\)\\-]{10,}"} placeholder={t("05xx xxx xx xx")} className="input" autoComplete="tel" />}{err("applicantPhone")}</Field>
            <Field label={t("İlçe")} required>
              <select name="district" required className="input" defaultValue="">
                <option value="" disabled>{t("Seçiniz")}</option>
                {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
              {err("district")}
            </Field>
          </div>
        </div>

        {/* 2. Kategori bilgileri */}
        <div ref={(el) => { stepRefs.current[1] = el; }} className={cn("space-y-5", step !== 1 && "hidden")}>
          {isSport && (
            <>
              <StepTitle n={2} title={t("Takım Bilgileri")} desc={`${sportDef ? `${sportDef.emoji} ${t(sportDef.label)}` : "Spor"} ligine katılacak takımın bilgileri.`} />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t("Takım Adı")} required>{<input name="title" required className="input" placeholder={t("ör. Dağkapı Gençlik SK")} />}{err("title")}</Field>
                <Field label="Kısa Ad (3 harf)">{<input name="shortName" maxLength={4} className="input uppercase" placeholder="DGK" />}</Field>
                {!period.sport && (
                  <Field label={t("Branş")} required>
                    <select name="sport" required className="input">{Object.values(SPORTS).map((s) => <option key={s.key} value={s.key}>{s.emoji} {t(s.label)}</option>)}</select>
                  </Field>
                )}
                {!period.gender && (
                  <Field label={t("Lig Kategorisi")} required>
                    <select name="gender" required className="input" defaultValue=""><option value="" disabled>{t("Seçiniz")}</option><option value="ERKEK">{t("Erkekler")}</option><option value="KADIN">{t("Kadınlar")}</option></select>
                    {err("gender")}
                  </Field>
                )}
                <Field label={t("Antrenör Adı Soyadı")} required>{<input name="coachName" required className="input" />}{err("coachName")}</Field>
                <Field label={t("Antrenör Telefonu")}>{<input name="coachPhone" type="tel" className="input" />}</Field>
                <Field label={t("Kuruluş Yılı")}>{<input name="foundedYear" type="number" min={1950} max={2030} className="input" />}</Field>
                <Field label={t("Tercih Edilen İç Saha / Salon")}>{<input name="homeVenue" className="input" />}</Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t("Ana Renk")}>{<input name="primaryColor" type="color" defaultValue="#0f766e" className="h-11 w-full cursor-pointer rounded-xl border border-basalt-200" />}</Field>
                  <Field label={t("İkinci Renk")}>{<input name="secondaryColor" type="color" defaultValue="#ffffff" className="h-11 w-full cursor-pointer rounded-xl border border-basalt-200" />}</Field>
                </div>
              </div>
              <Field label={t("Takımınızı kısaca tanıtın")}>{<textarea name="note" rows={3} className="input" placeholder={t("Takımın hikâyesi, hedefleri…")} />}</Field>
            </>
          )}
          {period.category === "MUZIK" && (
            <>
              <StepTitle n={2} title={t("Sanatçı / Grup Bilgileri")} desc="Sahnede görünecek isminiz ve müziğiniz hakkında." />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t("Sahne Adı / Grup Adı")} required>{<input name="title" required className="input" />}{err("title")}</Field>
                <Field label={t("Katılım Şekli")} required>
                  <select name="type" className="input"><option value="SOLO">{t("Solo")}</option><option value="GRUP">{t("Grup")}</option></select>
                </Field>
                <Field label={t("Müzik Türü")} required>
                  <select name="genre" required className="input" defaultValue=""><option value="" disabled>{t("Seçiniz")}</option>{MUSIC_GENRES.map((g) => <option key={g}>{g}</option>)}</select>
                  {err("genre")}
                </Field>
                <Field label="Demo / Performans Videosu (YouTube)">{<input name="demoUrl" type="url" placeholder={t("https://youtube.com/…")} className="input" />}</Field>
                <Field label={t("Instagram")}>{<input name="instagram" className="input" placeholder={t("@kullaniciadi")} />}</Field>
                <Field label={t("Yorumlamak istediğiniz eserler")}>{<input name="songs" className="input" placeholder={t("Eser 1, Eser 2")} />}</Field>
              </div>
              <Field label={t("Kendinizi tanıtın")}>{<textarea name="bio" rows={4} className="input" placeholder={t("Müzik geçmişiniz, ilham kaynaklarınız…")} />}</Field>
            </>
          )}
          {isWriting && (
            <>
              <StepTitle n={2} title={t("Eser Bilgileri")} desc="Genç Kalemler oyun yazarlığı yarışmasına göndereceğiniz metin." />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t("Eserin Adı")} required>{<input name="title" required className="input" />}{err("title")}</Field>
                <Field label={t("Rumuz")}>{<input name="penName" className="input" placeholder={t("Jüri metni bu adla okur")} />}</Field>
                <Field label={t("Metnin Dili")} required>
                  <select name="language" required className="input" defaultValue=""><option value="" disabled>{t("Seçiniz")}</option>{Object.entries(WRITING_LANGUAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  {err("language")}
                </Field>
                <Field label={t("Kategori")} required>
                  <select name="workCategory" required className="input" defaultValue=""><option value="" disabled>{t("Seçiniz")}</option>{Object.entries(WRITING_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v} ({WRITING_CATEGORY_HINT[k]})</option>)}</select>
                  {err("workCategory")}
                </Field>
                <Field label={t("Sayfa Sayısı")}>{<input name="pageCount" type="number" min={1} max={500} className="input" />}</Field>
                <Field label={t("Okul / Meslek")}>{<input name="school" className="input" />}</Field>
              </div>
              <Field label={t("Eserin Kısa Özeti")}>{<textarea name="synopsis" rows={4} className="input" placeholder={t("Konu, karakterler, sahne düzeni…")} />}</Field>
            </>
          )}
          {period.category === "TIYATRO" && (
            <>
              <StepTitle n={2} title={t("Topluluk & Oyun Bilgileri")} desc="Festivalde sahnelemek istediğiniz oyun." />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t("Topluluk Adı")} required>{<input name="title" required className="input" />}{err("title")}</Field>
                <Field label={t("Oyunun Adı")} required>{<input name="playTitle" required className="input" />}{err("playTitle")}</Field>
                <Field label={t("Yazar")} required>{<input name="playwright" required className="input" />}{err("playwright")}</Field>
                <Field label={t("Yönetmen")}>{<input name="director" className="input" />}</Field>
                <Field label={t("Tür")}>
                  <select name="genre" className="input">{THEATRE_GENRES.map((g) => <option key={g}>{g}</option>)}</select>
                </Field>
                <Field label="Süre (dakika)">{<input name="durationMin" type="number" min={10} max={240} className="input" />}</Field>
                <Field label={t("Oyun Dili")}>{<input name="language" defaultValue="Türkçe" className="input" />}</Field>
                <Field label={t("Prova / Oyun Videosu")}>{<input name="videoUrl" type="url" className="input" placeholder={t("https://youtube.com/…")} />}</Field>
              </div>
              <Field label={t("Oyunun Özeti")}>{<textarea name="synopsis" rows={4} className="input" />}</Field>
              <Field label={t("Teknik İhtiyaçlar (ışık, ses, dekor)")}>{<textarea name="techNeeds" rows={2} className="input" />}</Field>
            </>
          )}
          {isVolunteer && (
            <>
              <StepTitle n={2} title={t("Görev Bilgileri")} desc={t("Hakemlik, masa görevi, sahne ekibi, fotoğraf-video ve organizasyon gönüllülüğü.")} />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t("Görev")} required>
                  <select name="role" required className="input" defaultValue=""><option value="" disabled>{t("Seçiniz")}</option>{Object.entries(VOLUNTEER_ROLES).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}</select>
                  {err("role")}
                </Field>
                <Field label={t("Branş / Alan")}>
                  <select name="branch" className="input" defaultValue=""><option value="">—</option>{[...Object.values(SPORTS).map((s) => s.label), "Müzik", "Tiyatro", "Genel"].map((b) => <option key={b}>{t(b)}</option>)}</select>
                </Field>
                <Field label={t("Uygun olduğunuz zamanlar")}>{<input name="availability" className="input" placeholder={t("ör. hafta sonları, akşamları")} />}</Field>
              </div>
              <Field label={t("Deneyim ve belgeler")}>{<textarea name="experience" rows={3} className="input" placeholder={t("Hakemlik kursu, ilk yardım sertifikası, daha önce görev aldığınız etkinlikler…")} />}</Field>
            </>
          )}
          {!isWriting && !isVolunteer && (
            <ImagePicker
              name="doc_logo"
              label={isSport ? t("Takım Logosu") : period.category === "MUZIK" ? t("Sanatçı / Grup Fotoğrafı") : t("Topluluk Logosu")}
              hint={t("Kare, mümkünse saydam arka planlı PNG önerilir. Sitede kırpılmadan gösterilir.")}
              round={isSport}
              error={fe.doc_logo}
            />
          )}
        </div>

        {/* 3. Kadro */}
        <div ref={(el) => { stepRefs.current[2] = el; }} className={cn("space-y-5", step !== 2 && "hidden")}>
          <StepTitle n={3} title={isSport ? "Oyuncu Listesi" : period.category === "MUZIK" ? "Sanatçı / Grup Üyeleri" : isWriting ? "Yazar Bilgileri" : isVolunteer ? "Kişisel Bilgiler" : "Oyuncu & Teknik Ekip"}
            desc={`${period.minMembers ? `En az ${period.minMembers}` : ""}${period.minMembers && period.maxMembers ? ", " : ""}${period.maxMembers ? `en fazla ${period.maxMembers}` : ""} kişi.${period.minAge || period.maxAge ? ` Yaş aralığı: ${period.minAge ?? "—"}–${period.maxAge ?? "—"}.` : ""}`} />
          {err("members")}
          <div className="space-y-3">
            {members.map((m, i) => (
              <div key={i} className="rounded-2xl border border-basalt-200 bg-basalt-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-basalt-500">
                    {isSport && (
                      <label className="relative flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-basalt-200 text-basalt-500 ring-2 ring-white hover:ring-dicle-400" title={t("Oyuncu fotoğrafı")}>
                        {m.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.photo} alt="" className="h-full w-full object-cover" />
                        ) : <Camera className="h-4 w-4" />}
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label={t("Oyuncu fotoğrafı")}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try { setMember(i, "photo", await compressImage(f, 160, 0.75)); } catch (err) { alert(err instanceof Error ? err.message : String(err)); }
                          }} />
                      </label>
                    )}
                    {i + 1}. {memberWord}
                  </span>
                  {members.length > 1 && (
                    <button type="button" onClick={() => setMembers((l) => l.filter((_, idx) => idx !== i))} className="rounded-lg p-1.5 text-basalt-400 hover:bg-red-50 hover:text-red-600" aria-label={t("Kişiyi sil")}><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
                <div className={cn("grid gap-3", isSport ? "sm:grid-cols-2 lg:grid-cols-6" : "sm:grid-cols-4")}>
                  <input value={m.firstName ?? ""} onChange={(e) => setMember(i, "firstName", e.target.value)} placeholder={t("Ad *")} className={cn("input", isSport && "lg:col-span-1")} />
                  <input value={m.lastName ?? ""} onChange={(e) => setMember(i, "lastName", e.target.value)} placeholder={t("Soyad *")} className="input" />
                  <input type="date" value={m.birthDate ?? ""} onChange={(e) => setMember(i, "birthDate", e.target.value)} className="input" title={t("Doğum tarihi")} aria-label={t("Doğum tarihi")} />
                  {isSport ? (
                    <>
                      <select value={m.position ?? ""} onChange={(e) => setMember(i, "position", e.target.value)} className="input">
                        <option value="">{t("Mevki")}</option>
                        {(sportDef?.positions ?? Object.values(SPORTS).flatMap((s) => s.positions)).map((p) => <option key={p}>{p}</option>)}
                      </select>
                      <input type="number" min={0} max={99} value={m.jerseyNumber ?? ""} onChange={(e) => setMember(i, "jerseyNumber", e.target.value)} placeholder={t("Forma No")} className="input" />
                      <input value={m.identityNo ?? ""} onChange={(e) => setMember(i, "identityNo", e.target.value.replace(/\D/g, "").slice(0, 11))} inputMode="numeric" placeholder={t("T.C. Kimlik No")} className="input" />
                    </>
                  ) : (
                    <input value={m.role ?? ""} onChange={(e) => setMember(i, "role", e.target.value)} placeholder={t(period.category === "MUZIK" ? "Rol (vokal, gitar…)" : isWriting ? "Ortak yazar / tek yazar" : "Rol (oyuncu, ışık…)")} className="input" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={!!period.maxMembers && members.length >= period.maxMembers} onClick={() => setMembers((l) => [...l, {}])} className="btn-outline">
              <UserPlus className="h-4 w-4" /> {memberWord} Ekle
            </button>
            {isSport && (
              <button type="button" onClick={() => setMembers((l) => [...l, ...Array.from({ length: 5 }, () => ({}))].slice(0, period.maxMembers ?? 60))} className="btn-ghost"><Plus className="h-4 w-4" /> {t("5 satır ekle")}</button>
            )}
            <span className="text-sm text-basalt-500">{members.filter((m) => m.firstName && m.lastName).length} {t("kişi eklendi")}</span>
          </div>
          {isSport && <p className="hint">{t("T.C. kimlik numaraları yalnızca lisans işlemleri için kullanılır, sitede yayımlanmaz ve yalnızca yetkili yöneticiler tarafından görülebilir.")}</p>}
        </div>

        {/* 4. Belgeler */}
        <div ref={(el) => { stepRefs.current[3] = el; }} className={cn("space-y-5", step !== 3 && "hidden")}>
          <StepTitle n={4} title={t("İstenen Belgeler")} desc={`PDF, JPG, PNG, ZIP, MP3 veya Word. Dosya başına en fazla ${MAX_UPLOAD_MB} MB.`} />
          <div className="space-y-3">
            {docs.filter((d) => d.key !== "logo").map((d) => (
              <label key={d.key} className={cn("flex cursor-pointer flex-col gap-3 rounded-2xl border-2 border-dashed p-4 transition sm:flex-row sm:items-center", fileNames[d.key] ? "border-emerald-300 bg-emerald-50/50" : fe[`doc_${d.key}`] ? "border-red-300 bg-red-50/50" : "border-basalt-200 hover:border-dicle-400 hover:bg-dicle-500/5")}>
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", fileNames[d.key] ? "bg-emerald-500 text-white" : "bg-basalt-100 text-basalt-500")}>
                  {fileNames[d.key] ? <Check className="h-5 w-5" /> : <FileUp className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-basalt-900">{t(d.label)} {d.required ? <span className="text-red-500">*</span> : <span className="text-xs font-normal text-basalt-400">(isteğe bağlı)</span>}</span>
                  <span className="block truncate text-xs text-basalt-500">{fileNames[d.key] ?? d.hint ?? "Dosya seçmek için tıklayın"}</span>
                  {err(`doc_${d.key}`)}
                </span>
                <span className="btn-outline btn-sm pointer-events-none"><Upload className="h-3.5 w-3.5" /> {fileNames[d.key] ? "Değiştir" : "Seç"}</span>
                <input
                  type="file" name={`doc_${d.key}`} required={d.required} className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.zip,.mp3,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size > MAX_UPLOAD_MB * 1024 * 1024) { alert(`Dosya ${MAX_UPLOAD_MB} MB'tan büyük olamaz.`); e.target.value = ""; return; }
                    setFileNames((n) => ({ ...n, [d.key]: f ? `${f.name} · ${(f.size / 1024 / 1024).toFixed(1)} MB` : "" }));
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* 5. Onay */}
        <div ref={(el) => { stepRefs.current[4] = el; }} className={cn("space-y-5", step !== 4 && "hidden")}>
          <StepTitle n={5} title={t("Onay ve Gönderim")} desc="Göndermeden önce bilgilerinizi kontrol edin." />
          <div className="rounded-2xl bg-basalt-50 p-5 text-sm text-basalt-700">
            <p><strong>{members.filter((m) => m.firstName && m.lastName).length}</strong> {memberWord.toLowerCase()} · <strong>{Object.values(fileNames).filter(Boolean).length}</strong> / {docs.filter((d) => d.key !== "logo").length} {t("belge yüklendi")}</p>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="rules" required className="mt-0.5 h-5 w-5 rounded border-basalt-300 accent-dicle-600" />
            <span>Başvuru şartlarını okudum; verdiğim bilgilerin doğru olduğunu, yanlış beyan halinde başvurumun iptal edileceğini kabul ediyorum.</span>
          </label>
          {err("rules")}
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="kvkk" required className="mt-0.5 h-5 w-5 rounded border-basalt-300 accent-dicle-600" />
            <span><Link href="/kvkk" target="_blank" className="link">{t("KVKK Aydınlatma Metni")}</Link>&apos;ni okudum; kişisel verilerin organizasyon kapsamında işlenmesine açık rıza veriyorum. 18 yaş altı katılımcılar için veli onayı alınmıştır.</span>
          </label>
          {err("kvkk")}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-basalt-100 bg-basalt-50 px-6 py-4">
        <button type="button" onClick={prev} disabled={step === 0} className="btn-ghost"><ChevronLeft className="h-4 w-4" /> {t("Geri")}</button>
        <span className="text-xs text-basalt-500">{t("Adım")} {step + 1} / {STEPS.length}</span>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="btn-primary">{t("İleri")} <ChevronRight className="h-4 w-4" /></button>
        ) : (
          <button type="submit" disabled={pending} className="btn-accent">{pending ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("Gönderiliyor…")}</> : <>{t("Başvuruyu Gönder")} <Check className="h-4 w-4" /></>}</button>
        )}
      </div>
    </form>
  );
}

function stepHasErrorFor(fe: Record<string, string>, i: number) {
  const keys = Object.keys(fe);
  if (i === 0) return keys.some((k) => ["applicantName", "applicantEmail", "applicantPhone", "district"].includes(k));
  if (i === 1) return keys.some((k) => ["title", "gender", "coachName", "genre", "playTitle", "playwright", "language", "workCategory", "doc_logo", "role"].includes(k));
  if (i === 2) return !!fe.members;
  if (i === 3) return keys.some((k) => k.startsWith("doc_") && k !== "doc_logo");
  return !!fe.kvkk || !!fe.rules;
}

function StepTitle({ n, title, desc }: { n: number; title: string; desc?: string }) {
  const t = useT();
  return (
    <div className="mb-2">
      <p className="text-xs font-bold uppercase tracking-widest text-dicle-600">{t("Adım")} {n}</p>
      <h3 className="font-display text-2xl font-semibold uppercase tracking-wide">{t(title)}</h3>
      {desc && <p className="mt-1 text-sm text-basalt-500">{desc}</p>}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label} {required && <span className="text-red-500">*</span>}</label>
      {children}
    </div>
  );
}

/** Logo / fotoğraf seçici (önizlemeli) */
function ImagePicker({ name, label, hint, round, error }: { name: string; label: string; hint?: string; round?: boolean; error?: string }) {
  const t = useT();
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div>
      <label className="label">{label}</label>
      <label className={cn("flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition", error ? "border-red-300 bg-red-50/50" : preview ? "border-emerald-300 bg-emerald-50/40" : "border-basalt-200 hover:border-dicle-400")}>
        <span className={cn("flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-basalt-200", round ? "rounded-full p-1.5" : "rounded-xl")}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className={cn("h-full w-full", round ? "object-contain" : "object-cover")} />
          ) : <Upload className="h-5 w-5 text-basalt-400" />}
        </span>
        <span className="min-w-0 flex-1 text-sm">
          <span className="block font-medium text-basalt-900">{preview ? t("Değiştir") : t("Görsel seç (isteğe bağlı)")}</span>
          {hint && <span className="block text-xs text-basalt-500">{hint}</span>}
          {error && <span className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="h-3.5 w-3.5" /> {error}</span>}
        </span>
        <input type="file" name={name} accept="image/png,image/jpeg,image/webp" className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (preview) URL.revokeObjectURL(preview);
            setPreview(f ? URL.createObjectURL(f) : null);
          }} />
      </label>
    </div>
  );
}
