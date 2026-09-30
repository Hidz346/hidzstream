"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Play, Server } from "lucide-react";
import StreamPlayer from "@/components/stream-player";
import { imageSrc } from "@/components/utils";

export default function DrachinDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState(0);
  const [stream, setStream] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      fetch(`/api/drachin/detail/${encodeURIComponent(p.slug)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then(setData)
        .catch(() => setData({ status: false }));
    });
  }, [params]);

  const detail = data?.data || {};
  const episodes = Array.isArray(detail.episodes) ? detail.episodes : [];

  async function play(episode: number) {
    setError("");
    setStream("");

    try {
      const url = detail.episodes?.[episode - 1]?.url || slug;
      const response = await fetch(
        `/api/drachin/stream?url=${encodeURIComponent(url)}&episode=${episode}`,
        { cache: "no-store" },
      );
      const payload = await response.json();

      if (!response.ok || payload?.status === false) {
        throw new Error(payload?.message || "Drachin source tidak tersedia.");
      }

      setStream(payload?.data?.streamUrl || payload?.data?.servers?.[0]?.url || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat source Drachin.");
    }
  }

  if (!data) return <div className="surface rounded-3xl p-8 text-sm text-muted">Memuat detail...</div>;

  return (
    <div className="space-y-5">
      <Link href="/drachin" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white">
        <ArrowLeft size={15} /> HIDZ DRACHIN
      </Link>

      <section className="surface rounded-[28px] p-5 md:p-8">
        <div className="grid gap-6 md:grid-cols-[230px_1fr]">
          <img src={imageSrc(detail.thumbnail)} alt={detail.title || slug} className="w-full max-w-[230px] rounded-2xl" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">HIDZ DRACHIN</div>
            <h1 className="mt-2 text-3xl font-black">{detail.title || slug}</h1>
            <p className="mt-5 text-sm leading-7 text-muted">{detail.synopsis || "Sinopsis belum tersedia."}</p>
          </div>
        </div>
      </section>

      <section className="surface overflow-hidden rounded-[28px]">
        <div className="aspect-video bg-black">
          {stream ? (
            <StreamPlayer src={stream} title={detail.title || slug} onError={setError} />
          ) : (
            <div className="grid h-full place-items-center p-8 text-center text-sm text-muted">
              <div><Server className="mx-auto mb-3" size={28} /><p>Pilih episode untuk mulai.</p></div>
            </div>
          )}
        </div>
        {error && <div className="m-4 rounded-xl bg-red-500/10 px-4 py-3 text-xs text-red-200">{error}</div>}
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {episodes.map((episode: any, index: number) => (
              <button
                key={episode.id || episode.url || index}
                onClick={() => { setSelected(index); void play(Number(episode.episode || index + 1)); }}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-black ${index === selected ? "bg-white text-black" : "bg-white/5 text-white"}`}
              >
                <Play size={12} /> {episode.title || `Episode ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}