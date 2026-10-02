"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { cn, youtubeId } from "@/lib/utils";

/** Hafif YouTube oynatıcı: önce kapak görseli, tıklayınca gömülü video yüklenir */
export function YouTubeEmbed({ url, title, className, autoLoad = false }: { url: string | null | undefined; title: string; className?: string; autoLoad?: boolean }) {
  const id = youtubeId(url);
  const [active, setActive] = useState(autoLoad);
  if (!id) {
    return (
      <div className={cn("flex aspect-video w-full items-center justify-center rounded-2xl bg-basalt-900 text-sm text-white/60", className)}>
        Video henüz yüklenmedi
      </div>
    );
  }
  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl", className)}>
      {active ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setActive(true)} className="group absolute inset-0 h-full w-full" aria-label={`${title} videosunu oynat`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" onError={(e) => (e.currentTarget.style.visibility = "hidden")} className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition group-hover:scale-110">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </span>
          <span className="absolute bottom-3 left-4 right-4 line-clamp-1 text-left text-sm font-semibold text-white">{title}</span>
        </button>
      )}
    </div>
  );
}

export function YouTubeThumb({ url, className }: { url: string | null | undefined; className?: string }) {
  const id = youtubeId(url);
  return (
    <div className={cn("relative aspect-video overflow-hidden bg-basalt-900", className)}>
      {id && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" onError={(e) => (e.currentTarget.style.visibility = "hidden")} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/30 backdrop-blur transition group-hover:bg-red-600">
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </span>
      </span>
    </div>
  );
}
