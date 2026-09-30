import Link from "next/link";

export default function NotFound() {
  return <div className="surface mx-auto max-w-xl rounded-[28px] p-10 text-center"><div className="text-sm font-bold text-violet-300">404</div><h1 className="mt-2 text-3xl font-black">Halaman tidak ditemukan</h1><p className="mt-3 text-sm text-muted">Rute yang kamu buka tidak tersedia di HidzStreaming.</p><Link href="/" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-xs font-black text-black">Kembali ke home</Link></div>;
}
