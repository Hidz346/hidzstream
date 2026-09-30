"use client";

import { useMemo, useState } from "react";
import { Youtube, ExternalLink, Play } from "lucide-react";

function extractId(value: string) {
  const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
  return match?.[1] || (value.length >= 6 && /^[A-Za-z0-9_-]+$/.test(value) ? value : "");
}

export default function YoutubePage() {
  const [value,setValue]=useState("");
  const id=useMemo(()=>extractId(value.trim()),[value]);
  return <div className="space-y-6">
    <header className="surface rounded-[28px] p-6 md:p-8"><div className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">HIDZ STREAMING</div><h1 className="mt-2 text-3xl font-black">HIDZ YOUTUBE</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Masukkan URL atau video ID YouTube untuk menampilkan player embed.</p></header>
    <div className="surface rounded-[28px] p-4 md:p-6"><div className="flex flex-col gap-2 sm:flex-row"><input value={value} onChange={e=>setValue(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"/><a href={value?`https://www.youtube.com/results?search_query=${encodeURIComponent(value)}`:"https://www.youtube.com/"} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-black"><ExternalLink size={15}/> YouTube</a></div>
      <div className="mt-5 aspect-video overflow-hidden rounded-2xl bg-black">{id?<iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title="HIDZ YOUTUBE" className="h-full w-full border-0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>:<div className="grid h-full place-items-center text-center text-sm text-muted"><div><Play className="mx-auto mb-3" size={28}/><p>Player akan muncul setelah URL / video ID dimasukkan.</p></div></div>}</div>
    </div>
  </div>;
}
