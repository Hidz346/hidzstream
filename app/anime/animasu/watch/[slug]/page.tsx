"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw, Server, ShieldAlert } from "lucide-react";
import StreamPlayer, { isHls, isVideo } from "@/components/stream-player";

type StreamServer = { name: string; url: string };

function normalizeResponse(payload: any) {
  return payload?.data || payload?.episode_detail || payload?.result || payload;
}

function collectServers(data: any): StreamServer[] {
  const found: StreamServer[] = [];

  const push = (name: any, url: any) => {
    if (!url || typeof url !== "string") return;
    if (!found.some((item) => item.url === url)) found.push({ name: String(name || "Server"), url });
  };

  const qualities = data?.server?.qualities || data?.qualities || [];
  if (Array.isArray(qualities)) {
    for (const quality of qualities) {
      const list = quality?.serverList || quality?.servers || quality?.urls || [];
      if (!Array.isArray(list)) continue;
      for (const server of list) {
        push(
          quality?.title ? `${quality.title} - ${server?.title || server?.server || server?.name || "Server"}` : server?.title || server?.server || server?.name,
          server?.href || server?.url || server?.iframe || server?.src
        );
      }
    }
  }

  for (const server of data?.stream_servers || data?.servers || data?.streams || []) {
    push(server?.server || server?.name || server?.title, server?.iframe || server?.url || server?.href || server?.src);
  }

  push("Default", data?.defaultStreamingUrl);
  push("Stream", data?.streamUrl);
  push("Iframe", data?.iframe);

  return found;
}

export default function WatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState(0);
  const [resolved, setResolved] = useState("");
  const [kind, setKind] = useState<"iframe" | "video" | "hls">("iframe");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    params.then(async (p) => {
      if (cancelled) return;

      setSlug(p.slug);
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/anime/animasu/episode/${encodeURIComponent(p.slug)}`, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok || payload?.error) {
          throw new Error(payload?.error || `Episode API returned ${response.status}`);
        }

        if (!cancelled) {
          setData(normalizeResponse(payload));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setLoading(false);
          setError(err instanceof Error ? err.message : "Gagal memuat episode.");
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [params]);

  const servers = useMemo(() => collectServers(data), [data]);
  const active = servers[selected];

  useEffect(() => {
    setResolved(active?.url || "");
    if (active?.url && isHls(active.url)) setKind("hls");
    else if (active?.url && isVideo(active.url)) setKind("video");
    else setKind("iframe");
  }, [active?.url]);

  if (loading) return <div className="surface rounded-3xl p-8 text-sm text-muted">Memuat player dan server...</div>;

  if (error && !data) {
    return (
      <div className="surface rounded-3xl p-8 text-center">
        <ShieldAlert className="mx-auto mb-3 text-red-300" size={28} />
        <div className="text-sm font-black">Episode gagal dimuat</div>
        <p className="mt-2 text-xs leading-6 text-muted">{error}</p>
        <Link href="/anime" className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-black">Kembali</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/anime" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white">
        <ArrowLeft size={15}/> HIDZ ANIME
      </Link>

      <div className="surface overflow-hidden rounded-[28px]">
        <div className="aspect-video bg-black">
          {resolved && kind !== "iframe" ? (
            <StreamPlayer src={resolved} title={data?.title || slug} onError={setError} />
          ) : resolved ? (
            <iframe
              src={resolved}
              title={data?.title || slug}
              className="h-full w-full border-0"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="grid h-full place-items-center p-8 text-center text-xs text-muted">
              <div><Server className="mx-auto mb-3" size={26}/><p>Source streaming belum tersedia.</p></div>
            </div>
          )}
        </div>

        <div className="p-4 md:p-6">
          <h1 className="text-xl font-black">{data?.title || slug}</h1>

          {servers.length ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Server size={14}/> Streaming servers
              </div>
              <div className="flex flex-wrap gap-2">
                {servers.map((server, index) => (
                  <button
                    key={`${server.name}-${server.url}`}
                    onClick={() => setSelected(index)}
                    className={`rounded-full px-3 py-2 text-[11px] font-black transition ${index === selected ? "bg-white text-black" : "bg-white/5 text-muted hover:text-white"}`}
                  >
                    {server.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-4 text-xs text-muted">
              API episode tidak mengembalikan server streaming.
            </div>
          )}

          {active?.url && (
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={resolved || active.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-[11px] font-bold text-muted hover:text-white">
                <ExternalLink size={13}/> Buka source
              </a>
              {error && <span className="rounded-full bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-300">{error}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-muted">
        <RefreshCw className="mr-1 inline-block" size={12}/> Player web memakai source yang dikembalikan API; ketersediaan server mengikuti upstream.
      </div>
    </div>
  );
}
