"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Tv2, Youtube, Film, BookOpen, Sparkles, Clapperboard } from "lucide-react";
import Hero from "@/components/hero";
import MediaRow from "@/components/media-row";
import { getList, mediaImage, mediaSlug, mediaTitle } from "@/components/utils";
import type { MediaItem } from "@/components/types";

const baseItems = [
  ["/anime", "HIDZ ANIME", "Anime terbaru, episode dan detail.", Tv2],
  ["/comic", "HIDZ COMIC", "Manga, manhwa, dan komik.", BookOpen],
  ["/donghua", "HIDZ DONGHUA", "Animasi China dan episode terbaru.", Sparkles],
  ["/drachin", "HIDZ DRACHIN", "Hub drama China.", Clapperboard],
  ["/movies", "HIDZ MOVIES", "Movie dan rilisan pilihan.", Film],
  ["/youtube", "HIDZ YOUTUBE", "YouTube discovery & embed.", Youtube],
  ["/tv", "HIDZ TV", "Live TV dan HLS player.", Tv2],
] as const;

function normalize(items: any[], type: "anime" | "comic" | "donghua"): MediaItem[] {
  return items.slice(0, 16).map((item, i) => {
    const slug = mediaSlug(item);
    const title = mediaTitle(item);
    let href = "#";
    if (type === "anime") href = `/anime/animasu/detail/${slug}`;
    if (type === "comic") href = `/comic/detail/${slug}`;
    if (type === "donghua") href = `/donghua/detail/${slug}`;
    return { title, image: mediaImage(item), href, meta: item?.episode || item?.episodes || item?.type || (i === 0 ? "Terbaru" : ""), badge: type.toUpperCase() };
  }).filter((x) => x.title && x.href !== "#");
}

export default function Home() {
  const [anime, setAnime] = useState<any[]>([]);
  const [donghua, setDonghua] = useState<any[]>([]);
  const [comic, setComic] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/anime/animasu/home").then((r) => r.json()).catch(() => null),
      fetch("/api/donghua/home").then((r) => r.json()).catch(() => null),
      fetch("/api/comic/homepage").then((r) => r.json()).catch(() => null),
    ]).then(([a, d, c]) => {
      setAnime(getList(a));
      setDonghua(getList(d));
      setComic(getList(c));
    });
  }, []);

  const animeItems = useMemo(() => normalize(anime, "anime"), [anime]);
  const donghuaItems = useMemo(() => normalize(donghua, "donghua"), [donghua]);
  const comicItems = useMemo(() => normalize(comic, "comic"), [comic]);

  return (
    <div className="space-y-9">
      <Hero items={anime} />

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">HIDZ STREAMING</div>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Semua masuk satu hub.</h2>
          </div>
          <Link href="/anime" className="hidden items-center gap-1 text-xs font-bold text-muted hover:text-white sm:flex">Eksplor <ArrowRight size={14}/></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {baseItems.map(([href, title, desc, Icon]) => (
            <Link key={href} href={href} className="group surface rounded-2xl p-4 transition hover:-translate-y-1 hover:border-white/15">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-white transition group-hover:bg-violet-500/20 group-hover:text-violet-200">
                <Icon size={20}/>
              </div>
              <h3 className="mt-4 text-sm font-black">{title}</h3>
              <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <MediaRow title="HIDZ ANIME" subtitle="Update dari sumber anime." items={animeItems} href="/anime" />
      <MediaRow title="HIDZ DONGHUA" subtitle="Episode terbaru donghua." items={donghuaItems} href="/donghua" />
      <MediaRow title="HIDZ COMIC" subtitle="Komik yang sedang ramai." items={comicItems} href="/comic" />
    </div>
  );
}
