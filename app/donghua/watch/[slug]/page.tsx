"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Server } from "lucide-react";

export default function DonghuaWatch({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const [d, setD] = useState<any>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      fetch(`/api/donghua/episode/${encodeURIComponent(p.slug)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then(setD)
        .catch(() => setD({ error: true }));
    });
  }, [params]);

  const servers = Array.isArray(d?.data?.servers)
    ? d.data.servers
    : Array.isArray(d?.servers)
      ? d.servers
      : [];

  const current = servers[selected]?.url || servers[selected]?.iframe || "";

  if (!d) {
    return <div className="surface rounded-3xl p-8 text-sm text-muted">Memuat player...</div>;
  }

  return (
    <div className="space-y-5">
      <Link href="/donghua" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white">
        <ArrowLeft size={15}/> HIDZ DONGHUA
      </Link>

      <section className="surface overflow-hidden rounded-[28px]">
        <div className="aspect-video bg-black">
          {current ? (
            <iframe
              src={current}
              title={d.data?.title || d.title || slug}
              className="h-full w-full border-0"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="grid h-full place-items-center p-8 text-center text-sm text-muted">
              <div>
                <Server className="mx-auto mb-3" size={26}/>
                <p>Player dari sumber tidak tersedia.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-5">
          <h1 className="text-xl font-black">{d.data?.title || d.title || slug}</h1>

          <div className="mt-3 flex flex-wrap gap-2">
            {servers.map((server: any, index: number) => (
              <button
                key={`${server.name || server.title || "Server"}-${index}`}
                onClick={() => setSelected(index)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-black ${index === selected ? "bg-white text-black" : "bg-white/5 text-white"}`}
              >
                <ExternalLink size={12}/>
                {server.title || server.name || `Server ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
