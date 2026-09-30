"use client";

import { useEffect, useState } from "react";

type MangaPage = {
  url: string;
  key?: string | null;
  iv?: string | null;
};

function hexToBytes(value: string) {
  const clean = value.trim();

  if (!clean || clean.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(clean)) {
    throw new Error("Invalid AES value");
  }

  const bytes = new Uint8Array(clean.length / 2);

  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
  }

  return bytes;
}

export default function MangaPageImage({
  page,
  alt,
}: {
  page: MangaPage;
  alt: string;
}) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    async function load() {
      setFailed(false);

      try {
        const response = await fetch(
          `/api/image-proxy?url=${encodeURIComponent(page.url)}`,
          { cache: "force-cache" }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const bytes = await response.arrayBuffer();
        let blob: Blob;

        if (page.key && page.iv) {
          const cryptoKey = await crypto.subtle.importKey(
            "raw",
            hexToBytes(page.key),
            { name: "AES-CBC" },
            false,
            ["decrypt"]
          );

          const decrypted = await crypto.subtle.decrypt(
            { name: "AES-CBC", iv: hexToBytes(page.iv) },
            cryptoKey,
            bytes
          );

          blob = new Blob([decrypted], { type: "image/jpeg" });
        } else {
          blob = new Blob([bytes], {
            type: response.headers.get("content-type") || "image/jpeg",
          });
        }

        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setSrc(objectUrl);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [page.iv, page.key, page.url]);

  if (failed) {
    return (
      <div className="rounded-xl border border-red-400/10 bg-red-500/5 px-4 py-8 text-center text-xs text-red-200">
        Halaman gagal dimuat.
      </div>
    );
  }

  if (!src) {
    return (
      <div className="aspect-[2/3] animate-pulse rounded-xl bg-white/5" aria-hidden="true" />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="mx-auto block w-full rounded-xl"
      loading="lazy"
    />
  );
}
