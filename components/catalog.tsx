import MediaCard from "@/components/media-card";
import type { MediaItem } from "@/components/types";

export default function Catalog({ title, subtitle, items }: { title: string; subtitle: string; items: MediaItem[] }) {
  return (
    <div className="space-y-6">
      <header className="surface rounded-[28px] p-6 md:p-8">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">HIDZ STREAMING</div>
        <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{subtitle}</p>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {items.map((item, i) => <MediaCard key={`${item.title}-${i}`} item={item}/>)}
      </div>
    </div>
  );
}
