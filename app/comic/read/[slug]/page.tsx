"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { imageSrc } from "@/components/utils";

export default function ComicRead({ params }: { params: Promise<{ slug: string }> }) {
  const [slug,setSlug]=useState(""); const [d,setD]=useState<any>(null);
  useEffect(()=>{params.then(p=>{setSlug(p.slug);fetch(`/api/comic/chapter/${encodeURIComponent(p.slug)}`).then(r=>r.json()).then(setD).catch(()=>setD({error:true}))})},[params]);
  if(!d) return <div className="surface rounded-3xl p-8 text-sm text-muted">Memuat chapter...</div>;
  const raw=d.data||d; const images=Array.isArray(raw)?raw:(raw.images||raw.image_list||[]);
  return <div className="mx-auto max-w-4xl space-y-5">
    <Link href="/comic" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white"><ArrowLeft size={15}/> HIDZ COMIC</Link>
    <div className="surface rounded-[28px] p-3 md:p-5"><h1 className="px-2 pb-4 text-lg font-black">{raw.title||slug}</h1><div className="space-y-2">{images.map((img:any,i:number)=>{const url=typeof img==="string"?img:img.url||img.image||img.src;return <img key={i} src={imageSrc(url)} alt={`Page ${i+1}`} className="mx-auto block w-full rounded-xl" loading="lazy"/>})}</div></div>
  </div>;
}
