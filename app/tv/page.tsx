"use client";

import { useState } from "react";
import { Tv, Play } from "lucide-react";
import HlsPlayer from "@/components/hls-player";

export default function TvPage() {
  const [url,setUrl]=useState("");
  const [active,setActive]=useState("");
  return <div className="space-y-6">
    <header className="surface rounded-[28px] p-6 md:p-8"><div className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">HIDZ STREAMING</div><h1 className="mt-2 text-3xl font-black">HIDZ TV</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">HLS live player yang dapat dipakai untuk URL streaming yang memang boleh kamu akses.</p></header>
    <div className="surface overflow-hidden rounded-[28px]"><div className="aspect-video bg-black">{active?<HlsPlayer src={active}/>:<div className="grid h-full place-items-center text-center text-sm text-muted"><div><Tv className="mx-auto mb-3" size={29}/><p>Masukkan URL HLS/M3U8 untuk mulai.</p></div></div>}</div><div className="p-4 md:p-6"><div className="flex flex-col gap-2 sm:flex-row"><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com/live/stream.m3u8" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"/><button onClick={()=>setActive(url.trim())} disabled={!url.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-black disabled:opacity-40"><Play size={15}/> Putar</button></div></div></div>
  </div>;
}
