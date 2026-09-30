"use client";

import Link from "next/link";
import { useState } from "react";

const LOGO = "https://www.gobox.my.id/file/vVUoB.png";

export default function Brand({ compact = false }: { compact?: boolean }) {
  const [failed, setFailed] = useState(false);

  return (
    <Link href="/" className="flex items-center gap-3 min-w-0" aria-label="HidzStreaming home">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/30 shadow-lg">
        {!failed ? (
          <img src={LOGO} alt="HIDZPROJECT" className="h-full w-full object-cover" onError={() => setFailed(true)} />
        ) : (
          <img src="/hidzproject-fallback.svg" alt="" className="h-full w-full object-cover" />
        )}
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className="truncate text-[15px] font-black tracking-tight">HidzStreaming</div>
          <div className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">by HIDZPROJECT</div>
        </div>
      )}
    </Link>
  );
}
