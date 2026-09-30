"use client";

import { useEffect, useMemo, useState } from "react";
import Catalog from "@/components/catalog";
import { getList, mediaImage, mediaSlug, mediaTitle } from "@/components/utils";

export default function ComicPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/comic/homepage").then(r => r.json()).then(setData).catch(() => setData({})); }, []);
  const items = useMemo(() => getList(data).slice(0, 42).map((x: any) => ({ title: mediaTitle(x), image: mediaImage(x), href: `/comic/detail/${mediaSlug(x)}`, meta: x.chapter || x.status || "Comic", badge: "HIDZ COMIC" })), [data]);
  return <Catalog title="HIDZ COMIC" subtitle="Manga dan manhwa dengan halaman detail serta pembaca chapter." items={items}/>;
}
