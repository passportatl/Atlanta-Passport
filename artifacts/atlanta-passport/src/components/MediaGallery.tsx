import { useCallback, useEffect, useRef, useState } from "react";
import { X, Play, ChevronLeft, ChevronRight } from "lucide-react";

export interface MediaGalleryItem {
  src: string;
  alt: string;
  /** "image" (default) or "video" — controls both thumbnail badge and lightbox rendering. */
  type?: "image" | "video";
  /** Poster frame for video thumbnails; falls back to a dark placeholder. */
  poster?: string;
}

/**
 * Media gallery hub: a grid of selectable thumbnails that open a floating
 * enlarged lightbox — a photo or a playing video depending on what's selected.
 * Fully self-contained; closes on backdrop click, X button, or Escape.
 */
export default function MediaGallery({ items }: { items: MediaGalleryItem[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // The thumbnail that opened the lightbox — focus returns here on close.
  const triggerRef = useRef<HTMLElement | null>(null);
  // Single-row strip scrolling state.
  const stripRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = stripRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, items.length]);

  const scrollStrip = (dir: -1 | 1) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  useEffect(() => {
    if (selected === null) return;
    // Move focus into the dialog on open.
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
        return;
      }
      // Trap Tab focus inside the dialog while it is open.
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, video[controls], [href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !dialogRef.current.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last || !dialogRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    // Prevent background scroll while the lightbox is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      // Restore focus to the thumbnail that opened the lightbox.
      triggerRef.current?.focus();
    };
  }, [selected]);

  if (items.length === 0) return null;
  const active = selected !== null ? items[selected] : null;

  return (
    <>
      <div className="relative">
        <div
          ref={stripRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Photo and video gallery"
        >
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              triggerRef.current = e.currentTarget;
              setSelected(i);
            }}
            className="group relative rounded-xl overflow-hidden aspect-video w-56 sm:w-64 shrink-0 snap-start border-2 border-foreground shadow-pop-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            aria-label={`Open ${item.type === "video" ? "video" : "photo"}: ${item.alt}`}
          >
            {item.type === "video" ? (
              item.poster ? (
                <img
                  src={item.poster}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                  draggable={false}
                />
              ) : (
                <video
                  src={item.src}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  muted
                  playsInline
                  preload="metadata"
                />
              )
            ) : (
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
                draggable={false}
              />
            )}
            {item.type === "video" && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                <span className="w-11 h-11 rounded-full bg-white/90 border-2 border-foreground flex items-center justify-center">
                  <Play className="w-5 h-5 text-foreground translate-x-[1px]" fill="currentColor" />
                </span>
              </span>
            )}
          </button>
        ))}
        </div>

        {canLeft && (
          <button
            type="button"
            onClick={() => scrollStrip(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border-2 border-foreground shadow-pop-sm flex items-center justify-center hover:opacity-80 z-10"
            aria-label="Scroll gallery left"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        {canRight && (
          <button
            type="button"
            onClick={() => scrollStrip(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-9 h-9 rounded-full bg-white border-2 border-foreground shadow-pop-sm flex items-center justify-center hover:opacity-80 z-10"
            aria-label="Scroll gallery right"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>

      {active && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 md:p-10"
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          onClick={() => setSelected(null)}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setSelected(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white border-2 border-foreground shadow-pop-sm flex items-center justify-center hover:opacity-80"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
          <div
            className="max-w-5xl w-full max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {active.type === "video" ? (
              <video
                src={active.src}
                poster={active.poster}
                className="max-w-full max-h-[85vh] rounded-xl border-2 border-white/20"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={active.src}
                alt={active.alt}
                className="max-w-full max-h-[85vh] object-contain rounded-xl border-2 border-white/20"
                draggable={false}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
