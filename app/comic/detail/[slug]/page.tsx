"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { imageSrc } from "@/components/utils";

export default function ComicDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      fetch(`/api/comic/comic/${encodeURIComponent(p.slug)}`)
        .then((r) => r.json())
        .then(setD)
        .catch(() => setD({ error: true }));
    });
  }, [params]);

  if (!d) return <div className="surface rounded-3xl p-8 text-sm text-muted">Memuat detail...</div>;

  const raw = d.data || d;
  const image = raw.image || raw.poster || raw.thumbnail;
  const chapters = raw.chapters || raw.chapterList || [];

  return (
    <div className="space-y-6">
      <Link href="/comic" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white"><ArrowLeft size={15}/> HIDZ COMIC</Link>

      <section className="surface rounded-[28px] p-5 md:p-8">
        <div className="grid gap-6 md:grid-cols-[230px_1fr]">
          <img src={imageSrc(image)} alt={raw.title || slug} className="w-full max-w-[230px] rounded-2xl"/>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">HIDZ COMIC</div>
            <h1 className="mt-2 text-3xl font-black">{raw.title || slug}</h1>
            <p className="mt-5 text-sm leading-7 text-muted">{raw.synopsis || raw.description || "Deskripsi belum tersedia."}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(raw.genres || raw.tags || []).slice(0, 6).map((g: any, i: number) => (
                <span key={i} className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold">{typeof g === "string" ? g : g.name || g.title}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="surface rounded-[28px] p-5 md:p-8">
        <h2 className="text-lg font-black">Chapter</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {chapters.map((chapter: any, i: number) => {
            const id = chapter?.id || chapter?.chapterId || chapter?.chapter_id || chapter?.url;
            if (!id) return null;
            return (
              <Link
                key={`${id}-${i}`}
                href={`/comic/read/${encodeURIComponent(id)}`}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold hover:bg-white/10"
              >
                <span className="inline-flex items-center gap-2"><BookOpen size={13}/>{chapter.title || chapter.chapter || chapter.name || `Chapter ${i + 1}`}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
