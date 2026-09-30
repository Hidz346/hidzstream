"use client";

import { useEffect, useMemo, useState } from "react";
import Catalog from "@/components/catalog";
import { getList, mediaImage, mediaSlug, mediaTitle } from "@/components/utils";

export default function MoviesPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/anime/animasu/movies?page=1").then(r => r.json()).then(setData).catch(() => setData({})); }, []);
  const items = useMemo(() => getList(data).slice(0, 42).map((x: any) => ({ title: mediaTitle(x), image: mediaImage(x), href: `/anime/animasu/detail/${mediaSlug(x)}`, meta: "Movie", badge: "HIDZ MOVIES" })), [data]);
  return <Catalog title="HIDZ MOVIES" subtitle="Koleksi movie yang tersedia melalui katalog anime." items={items}/>;
}
