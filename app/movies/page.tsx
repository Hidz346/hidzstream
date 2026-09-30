"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Catalog from "@/components/catalog";
import { getList, mediaImage, mediaSlug, mediaTitle } from "@/components/utils";

export default function MoviesPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/anime/animasu/movies?page=1", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ status: false }));
  }, []);

  const items = useMemo(
    () =>
      getList(data).slice(0, 42).map((item: any) => ({
        title: mediaTitle(item),
        image: mediaImage(item),
        href: `/movies/detail/${encodeURIComponent(mediaSlug(item))}`,
        meta: item.rating ? `★ ${item.rating}` : item.year || "Movie",
        badge: item.badge || "HIDZ MOVIES",
      })),
    [data],
  );

  return (
    <div className="space-y-6">
      <Catalog
        title="HIDZ MOVIES"
        subtitle="Movie dan series dari source yang dipakai build APK."
        items={items}
      />
      {!items.length && data?.status === false && (
        <div className="surface rounded-2xl px-5 py-10 text-center text-sm text-muted">
          Source movie sedang tidak tersedia.
        </div>
      )}
    </div>
  );
}