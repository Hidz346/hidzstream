import Link from "next/link";
import { Search, ExternalLink, Drama } from "lucide-react";

export default function DrachinPage() {
  const searches = ["drama china sub indonesia", "chinese drama sub indo", "cdrama terbaru sub indo"];
  return <div className="space-y-6">
    <header className="surface rounded-[28px] p-6 md:p-8">
      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">HIDZ STREAMING</div>
      <h1 className="mt-2 text-3xl font-black">HIDZ DRACHIN</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Hub untuk menemukan drama China. Karena katalog sumber pihak ketiga berubah cepat, halaman ini memakai pencarian eksternal yang bisa dibuka langsung.</p>
    </header>
    <div className="grid gap-3 md:grid-cols-3">
      {searches.map((q)=><a key={q} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`} target="_blank" rel="noreferrer" className="surface group rounded-2xl p-5 hover:-translate-y-1"><div className="flex items-center justify-between"><Drama size={21}/><ExternalLink size={16} className="text-muted"/></div><h2 className="mt-6 text-sm font-black">{q}</h2><span className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-violet-300"><Search size={14}/> Buka pencarian</span></a>)}
    </div>
  </div>;
}
