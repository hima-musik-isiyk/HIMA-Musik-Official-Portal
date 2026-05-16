"use client";

import "./EmblaCarousel.css";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface Slide {
  src: string;
  alt: string;
}

interface EmblaCarouselProps {
  slides: Slide[];
  className?: string;
  aspectRatio?: string;
}

export const EmblaCarousel: React.FC<EmblaCarouselProps> = ({
  slides,
  className,
  aspectRatio = "aspect-square",
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    watchDrag: false, // browser owns drag/scroll; Embla just tracks state
    containScroll: "trimSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    const viewport = emblaApi.rootNode();
    if (!viewport) return;
    const slideWidth = viewport.offsetWidth;
    const index = Math.max(0, selectedIndex - 1);
    viewport.scrollTo({
      left: index * slideWidth,
      behavior: "smooth",
    });
  }, [emblaApi, selectedIndex]);

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    const viewport = emblaApi.rootNode();
    if (!viewport) return;
    const slideWidth = viewport.offsetWidth;
    const index = Math.min(slides.length - 1, selectedIndex + 1);
    viewport.scrollTo({
      left: index * slideWidth,
      behavior: "smooth",
    });
  }, [emblaApi, selectedIndex, slides.length]);

  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      const viewport = emblaApi.rootNode();
      if (!viewport) return;
      viewport.scrollTo({
        left: index * viewport.offsetWidth,
        behavior: "smooth",
      });
    },
    [emblaApi],
  );

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on("reInit", onInit);
    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("reInit", onInit);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onInit, onSelect]);

  // Sync Embla state to native scroll position
  useEffect(() => {
    if (!emblaApi) return;
    const viewport = emblaApi.rootNode();
    if (!viewport) return;

    const onScroll = () => {
      const slideWidth = viewport.offsetWidth;
      const index = Math.round(viewport.scrollLeft / slideWidth);

      // Only call scrollTo if it's a different slide to avoid loops
      if (index !== emblaApi.selectedScrollSnap()) {
        emblaApi.scrollTo(index, true); // true = jump without animation
      }
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [emblaApi]);

  return (
    <div
      className={cn("embla group relative", className)}
      style={{ "--slide-spacing": "0px" } as React.CSSProperties}
    >
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((slide, index) => (
            <div className="embla__slide" key={index}>
              <div
                className={cn("relative w-full overflow-hidden", aspectRatio)}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index === 0}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide Counter Overlay */}
      {slides.length > 1 && (
        <div className="absolute top-3 right-3 z-10 rounded-full bg-black/60 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-sm">
          {selectedIndex + 1} / {slides.length}
        </div>
      )}

      {/* Navigation Buttons - Desktop Only */}
      {slides.length > 1 && (
        <>
          <button
            className={cn(
              "absolute top-1/2 left-3 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/80 p-1.5 text-black shadow-md transition-all hover:bg-white md:flex",
              !canScrollPrev && "pointer-events-none opacity-0",
            )}
            onClick={scrollPrev}
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button
            className={cn(
              "absolute top-1/2 right-3 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/80 p-1.5 text-black shadow-md transition-all hover:bg-white md:flex",
              !canScrollNext && "pointer-events-none opacity-0",
            )}
            onClick={scrollNext}
            aria-label="Next slide"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-1.5">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all duration-300",
                index === selectedIndex
                  ? "scale-110 bg-white"
                  : "bg-white/40 hover:bg-white/60",
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
