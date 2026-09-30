"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { imageSrc } from "@/components/utils";

export default function DonghuaDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [slug,setSlug]=useState("");
  const [d,setD]=useState<any>(null);
  useEffect(()=>{params.then(p=>{setSlug(p.slug);fetch(`/api/donghua/detail/${encodeURIComponent(p.slug)}`).then(r=>r.json()).then(setD).catch(()=>setD({error:true}))})},[params]);
  if(!d) return <div className="surface rounded-3xl p-8 text-sm text-muted">Memuat detail...</div>;
  const poster = d.poster || d.data?.poster;
  const episodes = d.episodes || d.data?.episodes || [];
  const detail = d.data && !d.title ? d.data : d;
  return <div className="space-y-6">
    <Link href="/donghua" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white"><ArrowLeft size={15}/> Kembali</Link>
    <section className="surface rounded-[28px] p-5 md:p-8">
      <div className="grid gap-6 md:grid-cols-[230px_1fr]">
        <img src={imageSrc(poster)} alt={detail.title || slug} className="w-full max-w-[230px] rounded-2xl"/>
        <div><div className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">HIDZ DONGHUA</div><h1 className="mt-2 text-3xl font-black">{detail.title || slug}</h1><p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted">{detail.synopsis || "Sinopsis belum tersedia."}</p></div>
      </div>
    </section>
    <section className="surface rounded-[28px] p-5 md:p-8">
      <h2 className="text-lg font-black">Episode</h2>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-8">
        {episodes.map((ep:any,i:number)=> <Link key={i} href={`/donghua/watch/${encodeURIComponent(ep.episodeId || ep.slug || ep.id)}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-bold hover:bg-white/10"><span className="inline-flex items-center gap-1"><Play size={12}/>{ep.title || ep.episode || `EP ${i+1}`}</span></Link>)}
      </div>
    </section>
  </div>;
}
