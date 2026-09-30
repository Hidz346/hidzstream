"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import MangaPageImage from "@/components/manga-page-image";

export default function ComicRead({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState("");
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);

      fetch(`/api/comic/chapter/${encodeURIComponent(p.slug)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then(setD)
        .catch(() => setD({ error: true }));
    });
  }, [params]);

  if (!d) {
    return <div className="surface rounded-3xl p-8 text-sm text-muted">Memuat chapter...</div>;
  }

  const raw = d.data || d;
  const images = Array.isArray(raw) ? raw : raw.images || raw.image_list || [];
  const normalizedImages = images
    .map((page: any) => (typeof page === "string" ? { url: page } : page))
    .filter((page: any) => page?.url);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/comic" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-white">
        <ArrowLeft size={15}/> HIDZ COMIC
      </Link>

      <div className="surface rounded-[28px] p-3 md:p-5">
        <h1 className="px-2 pb-4 text-lg font-black">{raw.title || slug}</h1>

        <div className="space-y-3">
          {normalizedImages.map((page: any, index: number) => (
            <MangaPageImage
              key={page.url + index}
              page={page}
              alt={`Page ${index + 1}`}
            />
          ))}
        </div>

        {!normalizedImages.length && (
          <div className="rounded-2xl bg-white/5 px-4 py-10 text-center text-sm text-muted">
            Chapter tidak mengembalikan halaman yang bisa ditampilkan.
          </div>
        )}
      </div>
    </div>
  );
}
