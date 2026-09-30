"use client";

import Link from "next/link";
import { Play, Search, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { imageSrc, mediaImage, mediaSlug, mediaTitle } from "./utils";

export default function Hero({ items }: { items: any[] }) {
  const [index, setIndex] = useState(0);
  const item = items[index];

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((v) => (v + 1) % Math.min(items.length, 5)), 6500);
    return () => clearInterval(id);
  }, [items.length]);

  if (!item) {
    return (
      <section className="surface relative overflow-hidden rounded-[28px] p-7 md:p-10">
        <div className="max-w-2xl">
          <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">HIDZPROJECT STREAM HUB</span>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">HidzStreaming</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted md:text-base">Satu interface untuk anime, komik, donghua, movie, YouTube dan live TV.</p>
          <Link href="/anime" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black transition hover:-translate-y-0.5"><Play size={16}/> Mulai menjelajah</Link>
        </div>
      </section>
    );
  }

  const title = mediaTitle(item);
  const slug = mediaSlug(item);
  const href = `/anime/animasu/detail/${slug}`;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black">
      <div className="absolute inset-0">
        <img src={imageSrc(mediaImage(item))} alt="" className="h-full w-full object-cover opacity-80 blur-[1px] scale-105" />
        <div className="hero-mask absolute inset-0" />
      </div>
      <div className="relative min-h-[430px] px-5 py-8 md:min-h-[500px] md:px-10 md:py-12">
        <div className="flex max-w-2xl flex-col justify-end min-h-[360px] md:min-h-[410px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider">FEATURED</span>
            <span className="rounded-full bg-violet-500/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider">HIDZ ANIME</span>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-xl line-clamp-2 text-sm leading-6 text-white/70">Temukan episode terbaru dan detail lengkap dari katalog HidzStreaming.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={href} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black"><Play size={16} className="fill-current"/> Lihat detail</Link>
            <Link href="/search" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold"><Search size={16}/> Cari</Link>
          </div>
          {items.length > 1 && (
            <div className="mt-7 flex items-center gap-2">
              {items.slice(0,5).map((_, i) => <button key={i} aria-label={`Slide ${i+1}`} onClick={() => setIndex(i)} className={`h-1.5 rounded-full transition-all ${i===index ? "w-8 bg-white" : "w-2 bg-white/30"}`} />)}
              <ChevronRight size={15} className="ml-1 text-white/40"/>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
