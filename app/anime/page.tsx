"use client";

import { useEffect, useMemo, useState } from "react";
import Catalog from "@/components/catalog";
import { getList, mediaImage, mediaSlug, mediaTitle } from "@/components/utils";

export default function AnimePage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/anime/animasu/home").then(r => r.json()).then(setData).catch(() => setData({})); }, []);
  const items = useMemo(() => getList(data).slice(0, 42).map((x: any) => ({ title: mediaTitle(x), image: mediaImage(x), href: `/anime/animasu/detail/${mediaSlug(x)}`, meta: x.episode || x.status || "Anime", badge: "HIDZ ANIME" })), [data]);
  return <Catalog title="HIDZ ANIME" subtitle="Katalog anime dengan halaman detail dan pemutar episode." items={items}/>;
}
