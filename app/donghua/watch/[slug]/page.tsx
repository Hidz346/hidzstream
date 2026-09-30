"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function DonghuaWatch({ params }: { params: Promise<{ slug: string }> }) {
  const [slug,setSlug]=useState("");
  const [d,setD]=useState<any>(null);
  useEffect(()=>{params.then(p=>{setSlug(p.slug);fetch(`/api/donghua/episode/${encodeURIComponent(p.slug)}`).then(r=>r.json()).then(setD).catch(()=>setD({error:true}))})},[params]);
  const servers = useMemo(()=> (d?.servers || d?.data?.servers || []).filter((x:any)=>x?.url),[d]);
  const current = servers[0]?.url;
  if(!d) return <div className="surface rounded-3xl p-8 text-sm text-muted">Memuat player...</div>;
  return <div className="space-y-5">
    <Link href="/donghua" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white"><ArrowLeft size={15}/> HIDZ DONGHUA</Link>
    <section className="surface overflow-hidden rounded-[28px]">
      <div className="aspect-video bg-black">{current?<iframe src={current} title={d.title||slug} className="h-full w-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/>:<div className="grid h-full place-items-center p-8 text-center text-sm text-muted">Player dari sumber tidak tersedia.</div>}</div>
      <div className="p-5"><h1 className="text-xl font-black">{d.title || slug}</h1><div className="mt-3 flex flex-wrap gap-2">{servers.map((s:any,i:number)=><a key={i} href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-2 text-[11px] font-black"><ExternalLink size={12}/>{s.title || s.name || `Server ${i+1}`}</a>)}</div></div>
    </section>
  </div>;
}
