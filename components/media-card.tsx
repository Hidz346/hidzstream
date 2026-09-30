import Link from "next/link";
import type { MediaItem } from "./types";
import { imageSrc } from "./utils";

export default function MediaCard({ item }: { item: MediaItem }) {
  return (
    <Link href={item.href} className="group block min-w-0">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)]">
        <img src={imageSrc(item.image)} alt={item.title} className="card-image w-full transition duration-500 group-hover:scale-[1.04]" loading="lazy" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent opacity-90" />
        {item.badge && <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur">{item.badge}</span>}
      </div>
      <div className="mt-2 text-sm font-bold line-clamp-2">{item.title}</div>
      {item.meta && <div className="mt-1 text-[11px] text-muted">{item.meta}</div>}
    </Link>
  );
}
