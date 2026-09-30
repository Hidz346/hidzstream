"use client";

import { useEffect, useMemo, useState } from "react";
import Catalog from "@/components/catalog";
import { getList, mediaImage, mediaSlug, mediaTitle } from "@/components/utils";

export default function DonghuaPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/donghua/home").then(r => r.json()).then(setData).catch(() => setData({})); }, []);
  const items = useMemo(() => getList(data).slice(0, 42).map((x: any) => ({ title: mediaTitle(x), image: mediaImage(x), href: `/donghua/detail/${mediaSlug(x)}`, meta: x.episode || x.episodes || x.status || "Donghua", badge: "HIDZ DONGHUA" })), [data]);
  return <Catalog title="HIDZ DONGHUA" subtitle="Animasi China dengan detail, episode dan player." items={items}/>;
}
