import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-basalt-wall flex min-h-screen flex-col items-center justify-center px-4 text-center text-white">
      <p className="font-display text-[8rem] font-bold leading-none text-white/10">404</p>
      <h1 className="-mt-8 font-display text-3xl font-semibold uppercase">Ofsayt! Sayfa bulunamadı</h1>
      <p className="mt-3 max-w-md text-white/60">Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <Link href="/" className="btn mt-8 bg-white text-basalt-900">Ana Sayfaya Dön</Link>
    </div>
  );
}
