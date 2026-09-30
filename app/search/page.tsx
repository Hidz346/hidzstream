"use client";

import { Search } from "lucide-react";
import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";
import MediaCard from "@/components/media-card";
import { getList, mediaImage, mediaSlug, mediaTitle } from "@/components/utils";
import { useSearchParams } from "next/navigation";

function SearchInner() {
  const params = useSearchParams();
  const initial = params.get("q") || "";
  const [q, setQ] = useState(initial);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!initial) return;
    fetch(`/api/anime/animasu/search/${encodeURIComponent(initial)}?page=1`).then(r => r.json()).then(setData).catch(() => setData({}));
  }, [initial]);

  const items = useMemo(() => getList(data).slice(0, 50).map((x: any) => ({ title: mediaTitle(x), image: mediaImage(x), href: `/anime/animasu/detail/${mediaSlug(x)}`, meta: x.episode || x.status || "Result", badge: "SEARCH" })), [data]);

  return (
    <div className="space-y-6">
      <form action="/search" className="surface flex items-center gap-3 rounded-2xl p-3">
        <Search size={19} className="text-muted"/>
        <input name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul..." className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none"/>
        <button className="rounded-xl bg-white px-4 py-2 text-xs font-black text-black">Cari</button>
      </form>
      <div>
        <h1 className="text-xl font-black">Hasil pencarian{initial ? `: ${initial}` : ""}</h1>
        <p className="mt-1 text-xs text-muted">Pencarian diproses melalui sumber anime.</p>
      </div>
      {items.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">{items.map((item,i)=><MediaCard key={i} item={item}/>)}</div> : <div className="surface rounded-2xl px-5 py-12 text-center text-sm text-muted">Tidak ada hasil yang tersedia.</div>}
    </div>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<div className="surface rounded-2xl px-5 py-12 text-center text-sm text-muted">Memuat pencarian...</div>}><SearchInner /></Suspense>;
}
