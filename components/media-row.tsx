import Link from "next/link";
import type { MediaItem } from "./types";
import MediaCard from "./media-card";

export default function MediaRow({ title, subtitle, items, href }: { title: string; subtitle?: string; items: MediaItem[]; href?: string }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        {href && <Link href={href} className="text-xs font-bold text-violet-300 hover:text-white">Lihat semua</Link>}
      </div>
      {items.length ? (
        <div className="grid grid-flow-col auto-cols-[145px] gap-3 overflow-x-auto pb-2 md:grid-flow-row md:auto-cols-auto md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 hide-scrollbar">
          {items.map((item, i) => <MediaCard item={item} key={`${item.title}-${i}`} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-muted">Konten belum tersedia dari sumber saat ini.</div>
      )}
    </section>
  );
}
