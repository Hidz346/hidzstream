"use client";

import { useEffect, useMemo, useState } from "react";
import Catalog from "@/components/catalog";
import { getList, mediaImage, mediaSlug, mediaTitle } from "@/components/utils";

export default function DrachinPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/drachin/home?page=1", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ status: false }));
  }, []);

  const items = useMemo(
    () =>
      getList(data).slice(0, 42).map((item: any) => ({
        title: mediaTitle(item),
        image: mediaImage(item),
        href: `/drachin/detail/${encodeURIComponent(mediaSlug(item))}`,
        meta: "Sub Indo",
        badge: item.badge || "HIDZ DRACHIN",
      })),
    [data],
  );

  return (
    <Catalog
      title="HIDZ DRACHIN"
      subtitle="Drama China dengan katalog, detail, episode dan player."
      items={items}
    />
  );
}