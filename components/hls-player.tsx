"use client";

export default function HlsPlayer({ src }: { src: string }) {
  return (
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      className="h-full w-full bg-black"
    >
      Browser ini belum mendukung pemutaran stream HLS secara native.
    </video>
  );
}
