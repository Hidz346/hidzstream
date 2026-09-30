"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";

export default function WatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => { params.then(p => { setSlug(p.slug); fetch(`/api/anime/animasu/episode/${encodeURIComponent(p.slug)}`).then(r=>r.json()).then(setData).catch(()=>setData({error:true})); }); }, [params]);

  const servers = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.stream_servers)) return data.stream_servers.map((x:any)=>({name:x.server || x.name || "Server", url:x.iframe || x.url || x.href})).filter((x:any)=>x.url);
    if (Array.isArray(data.streams)) return data.streams.map((x:any)=>({name:x.name || "Server", url:x.url || x.iframe})).filter((x:any)=>x.url);
    if (data.server?.qualities) return data.server.qualities.flatMap((q:any)=>q.serverList || []).map((x:any)=>({name:x.title || x.server || "Server",url:x.href || x.url})).filter((x:any)=>x.url);
    return [];
  }, [data]);

  if (!data) return <div className="surface rounded-3xl p-8 text-sm text-muted">Memuat player...</div>;
  const current = servers[selected]?.url;

  return (
    <div className="space-y-5">
      <Link href="/anime" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white"><ArrowLeft size={15}/> HIDZ ANIME</Link>
      <div className="surface overflow-hidden rounded-[28px]">
        <div className="aspect-video bg-black">
          {current ? <iframe src={current} title={data.title || slug} className="h-full w-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/> : (
            <div className="grid h-full place-items-center p-8 text-center text-sm text-muted"><div><RefreshCw className="mx-auto mb-3" size={26}/><p>Player langsung dari sumber tidak tersedia untuk episode ini.</p></div></div>
          )}
        </div>
        <div className="p-4 md:p-6">
          <h1 className="text-xl font-black">{data.title || slug}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {servers.map((s:any,i:number)=><button key={i} onClick={()=>setSelected(i)} className={`rounded-full px-3 py-2 text-[11px] font-black ${i===selected?"bg-white text-black":"bg-white/5 text-muted hover:text-white"}`}>{s.name}</button>)}
            {current && <a href={current} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-2 text-[11px] font-black text-muted hover:text-white"><ExternalLink size={13}/> Buka sumber</a>}
          </div>
        </div>
      </div>
    </div>
  );
}
