"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Play, CalendarDays } from "lucide-react";
import { imageSrc } from "@/components/utils";

export default function AnimeDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      fetch(`/api/anime/animasu/detail/${encodeURIComponent(p.slug)}`)
        .then((r) => r.json())
        .then(setData)
        .catch(() => setData({ error: true }));
    });
  }, [params]);

  const d = data?.data || data?.anime_detail || data || {};
  const eps = d?.episodeList || d?.episode_list || d?.episodes || [];
  const synopsis =
    typeof d.synopsis === "string"
      ? d.synopsis
      : d.synopsis?.paragraphs?.join("\n\n") || "Sinopsis belum tersedia.";

  if (!data) return <div className="surface rounded-3xl p-8 text-sm text-muted">Memuat detail...</div>;

  return (
    <div className="space-y-6">
      <Link href="/anime" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white">
        <ArrowLeft size={15} /> Kembali ke HIDZ ANIME
      </Link>

      <section className="surface overflow-hidden rounded-[28px]">
        <div className="grid gap-6 p-5 md:grid-cols-[230px_1fr] md:p-8">
          <img
            src={imageSrc(d.poster || d.thumb || d.thumbnail)}
            alt={d.title || slug}
            className="mx-auto w-[190px] rounded-2xl object-cover shadow-2xl md:mx-0 md:w-full"
          />

          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">HIDZ ANIME</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight">{d.title || slug}</h1>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-muted">
              <span className="rounded-full bg-white/5 px-3 py-1">
                {typeof d.status === "object" ? d.status?.name : d.status || "Unknown"}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1">{d.year || d.release_date || "—"}</span>
              <span className="rounded-full bg-white/5 px-3 py-1">{d.score || d.rating || "N/A"}</span>
            </div>

            <p className="mt-6 whitespace-pre-line text-sm leading-7 text-muted">{synopsis}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {eps[eps.length - 1]?.url || eps[eps.length - 1]?.episodeId ? (
                <Link
                  href={`/anime/animasu/watch/${encodeURIComponent(
                    eps[eps.length - 1]?.episodeId || eps[eps.length - 1]?.url
                  )}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black text-black"
                >
                  <Play size={15} className="fill-current" /> Putar episode
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="surface rounded-[28px] p-5 md:p-8">
        <div className="flex items-center gap-2"><CalendarDays size={18} /><h2 className="text-lg font-black">Episode</h2></div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
          {eps.map((ep: any, i: number) => {
            const id = ep.episodeId || ep.url || ep.slug || ep.id;
            if (!id) return null;
            return (
              <Link
                key={`${id}-${i}`}
                href={`/anime/animasu/watch/${encodeURIComponent(id)}`}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-bold hover:bg-white/10"
              >
                {ep.title || ep.episode || `EP ${i + 1}`}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
