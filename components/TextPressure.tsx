import type { PointerEventHandler, TouchEventHandler } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface TextPressureProps {
  text?: string;
  fontFamily?: string;
  fontUrl?: string;
  autoFit?: boolean;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  alpha?: boolean;
  flex?: boolean;
  stroke?: boolean;
  scale?: boolean;
  textColor?: string;
  strokeColor?: string;
  className?: string;
  minFontSize?: number;
  /** Warm-up duration in ms — smoothly blends from rest values to mouse-driven values */
  warmupDuration?: number;
  actuationDuration?: number;
  actuationWghtFrom?: number;
  actuationWdthFrom?: number;
  actuationItalFrom?: number;
  actuationAlphaFrom?: number;
  minWghtFloor?: number;
  minWdthFloor?: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const getAttr = (
  distance: number,
  maxDist: number,
  minVal: number,
  maxVal: number,
) => {
  const val = maxVal - Math.abs((maxVal * distance) / maxDist);
  return Math.max(minVal, val + minVal);
};

const debounce = <T extends unknown[]>(
  func: (...args: T) => void,
  delay: number,
) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

const CURSOR_STORAGE_KEY = "hima-cursor-position";

// Module-level global cursor tracker — always up-to-date regardless of
// whether a TextPressure instance is mounted.
const globalCursor = { x: 0, y: 0, initialised: false };

if (typeof window !== "undefined") {
  const trackMouse = (e: MouseEvent) => {
    globalCursor.x = e.clientX;
    globalCursor.y = e.clientY;
    globalCursor.initialised = true;
  };
  const trackTouch = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) {
      globalCursor.x = t.clientX;
      globalCursor.y = t.clientY;
      globalCursor.initialised = true;
    }
  };
  window.addEventListener("mousemove", trackMouse, { passive: true });
  window.addEventListener("touchmove", trackTouch, { passive: true });
}

const TextPressure: React.FC<TextPressureProps> = ({
  text = "Compressa",
  fontFamily = "Compressa VF",
  fontUrl = "https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2",
  autoFit = true,
  width = true,
  weight = true,
  italic = true,
  alpha = false,
  flex = true,
  stroke = false,
  scale = false,
  textColor = "#FFFFFF",
  strokeColor = "#FF0000",
  className = "",
  minFontSize = 24,
  warmupDuration = 0,
  actuationDuration,
  actuationWghtFrom,
  actuationWdthFrom,
  actuationItalFrom,
  actuationAlphaFrom,
  minWghtFloor,
  minWdthFloor,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);
  const actuationStartRef = useRef<number | null>(null);
  const actuationBlendRef = useRef(
    (actuationDuration ?? warmupDuration) > 0 ? 0 : 1,
  );

  const mouseRef = useRef({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });
  const isFirstFrameRef = useRef(true);

  const restWghtRef = useRef<number[]>([]);
  const restWdthRef = useRef<number[]>([]);
  const restItalRef = useRef<number[]>([]);
  const restAlphaRef = useRef<number[]>([]);

  const [fontSize, setFontSize] = useState(minFontSize);
  const [scaleY, setScaleY] = useState(1);
  const [lineHeight, setLineHeight] = useState(1);

  const chars = text.split("");

  const updateCursor = useCallback((x: number, y: number) => {
    cursorRef.current.x = x;
    cursorRef.current.y = y;
    globalCursor.x = x;
    globalCursor.y = y;
    globalCursor.initialised = true;
    try {
      window.sessionStorage.setItem(
        CURSOR_STORAGE_KEY,
        JSON.stringify({ x, y }),
      );
    } catch {}
  }, []);

  const handlePointerEvent: PointerEventHandler<HTMLDivElement> = (event) => {
    updateCursor(event.clientX, event.clientY);
  };

  const handleTouchEvent: TouchEventHandler<HTMLDivElement> = (event) => {
    const t = event.touches[0];
    if (t) {
      updateCursor(t.clientX, t.clientY);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      updateCursor(e.clientX, e.clientY);
    };
    const handlePointerDown = (e: PointerEvent) => {
      updateCursor(e.clientX, e.clientY);
    };
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      updateCursor(t.clientX, t.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });

    // Immediately seed both refs with the real cursor position so the very
    // first animation frame uses correct distance calculations — no catch-up.
    if (globalCursor.initialised) {
      mouseRef.current.x = globalCursor.x;
      mouseRef.current.y = globalCursor.y;
      cursorRef.current.x = globalCursor.x;
      cursorRef.current.y = globalCursor.y;
    } else if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem(CURSOR_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { x: number; y: number };
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            updateCursor(parsed.x, parsed.y);
            mouseRef.current.x = parsed.x;
            mouseRef.current.y = parsed.y;
          }
        } catch {}
      }
    } else if (containerRef.current) {
      // Fallback: centre of container (touch devices where no move fired yet)
      const { left, top, width, height } =
        containerRef.current.getBoundingClientRect();
      mouseRef.current.x = left + width / 2;
      mouseRef.current.y = top + height / 2;
      cursorRef.current.x = mouseRef.current.x;
      cursorRef.current.y = mouseRef.current.y;
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [updateCursor]);

  const setSize = useCallback(() => {
    if (!containerRef.current || !titleRef.current) return;

    const { width: containerW, height: containerH } =
      containerRef.current.getBoundingClientRect();

    let newFontSize = containerW / (chars.length / 2);
    newFontSize = Math.max(newFontSize, minFontSize);

    setFontSize(newFontSize);
    setScaleY(1);
    setLineHeight(1);

    requestAnimationFrame(() => {
      if (!titleRef.current) return;
      const textRect = titleRef.current.getBoundingClientRect();

      if (scale && textRect.height > 0) {
        const yRatio = containerH / textRect.height;
        setScaleY(yRatio);
        setLineHeight(yRatio);
      }
    });
  }, [chars.length, minFontSize, scale]);

  useEffect(() => {
    if (!autoFit) return;
    const debouncedSetSize = debounce(setSize, 100);
    debouncedSetSize();
    window.addEventListener("resize", debouncedSetSize);
    return () => window.removeEventListener("resize", debouncedSetSize);
  }, [autoFit, setSize]);

  useEffect(() => {
    let rafId: number;

    const animate = (now: number) => {
      const actuationMs = actuationDuration ?? warmupDuration;
      if (actuationMs > 0) {
        if (actuationStartRef.current === null) {
          actuationStartRef.current = now;
        }
        const elapsed = now - actuationStartRef.current;
        const rawProgress = Math.min(elapsed / actuationMs, 1);
        actuationBlendRef.current = easeOutCubic(rawProgress);
      } else {
        actuationBlendRef.current = 1;
      }

      const blend = actuationBlendRef.current;

      // On the very first frame, snap mouseRef directly to cursorRef so
      // there is zero lag; subsequent frames use the normal smoothing.
      if (isFirstFrameRef.current) {
        mouseRef.current.x = cursorRef.current.x;
        mouseRef.current.y = cursorRef.current.y;
        isFirstFrameRef.current = false;
      } else {
        mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x) / 15;
        mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y) / 15;
      }

      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        const maxDist = titleRect.width / 2;

        spansRef.current.forEach((span, i) => {
          if (!span) return;

          const rect = span.getBoundingClientRect();
          const charCenter = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          };

          const d = dist(cursorRef.current, charCenter);

          const baseWdth = width
            ? Math.floor(getAttr(d, maxDist, 5, 200))
            : 100;
          const baseWght = weight
            ? Math.floor(getAttr(d, maxDist, 100, 900))
            : 400;
          const targetWdth = width
            ? Math.max(minWdthFloor ?? 5, baseWdth)
            : baseWdth;
          const targetWght = weight
            ? Math.max(minWghtFloor ?? 100, baseWght)
            : baseWght;
          const targetItal = italic
            ? parseFloat(getAttr(d, maxDist, 0, 1).toFixed(2))
            : 0;
          const targetAlpha = alpha
            ? parseFloat(getAttr(d, maxDist, 0, 1).toFixed(2))
            : 1;

          if (restWdthRef.current[i] === undefined) {
            restWdthRef.current[i] = actuationWdthFrom ?? targetWdth;
          }
          if (restWghtRef.current[i] === undefined) {
            restWghtRef.current[i] = actuationWghtFrom ?? targetWght;
          }
          if (restItalRef.current[i] === undefined) {
            restItalRef.current[i] = actuationItalFrom ?? targetItal;
          }
          if (restAlphaRef.current[i] === undefined) {
            restAlphaRef.current[i] = actuationAlphaFrom ?? targetAlpha;
          }

          const wdth = Math.floor(
            lerp(restWdthRef.current[i], targetWdth, blend),
          );
          const wght = Math.floor(
            lerp(restWghtRef.current[i], targetWght, blend),
          );
          const italVal = lerp(
            restItalRef.current[i],
            targetItal,
            blend,
          ).toFixed(2);
          const alphaVal = lerp(
            restAlphaRef.current[i],
            targetAlpha,
            blend,
          ).toFixed(2);

          const newFontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;

          if (span.style.fontVariationSettings !== newFontVariationSettings) {
            span.style.fontVariationSettings = newFontVariationSettings;
          }
          if (alpha && span.style.opacity !== alphaVal) {
            span.style.opacity = alphaVal;
          }
        });
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [
    width,
    weight,
    italic,
    alpha,
    warmupDuration,
    actuationDuration,
    actuationWghtFrom,
    actuationWdthFrom,
    actuationItalFrom,
    actuationAlphaFrom,
    minWghtFloor,
    minWdthFloor,
  ]);

  const styleElement = useMemo(() => {
    return (
      <style>{`
        ${
          fontUrl?.trim()
            ? `
        @font-face {
          font-family: '${fontFamily}';
          src: url('${fontUrl}');
          font-style: normal;
        }
        `
            : ""
        }

        .text-pressure-flex {
          display: flex;
          justify-content: space-between;
        }

        .text-pressure-stroke span {
          position: relative;
          color: ${textColor};
        }
        .text-pressure-stroke span::after {
          content: attr(data-char);
          position: absolute;
          left: 0;
          top: 0;
          color: transparent;
          z-index: -1;
          -webkit-text-stroke-width: 3px;
          -webkit-text-stroke-color: ${strokeColor};
        }

        .text-pressure-title {
          color: ${textColor};
        }
      `}</style>
    );
  }, [fontFamily, fontUrl, textColor, strokeColor]);

  const dynamicClassName = [
    className,
    flex ? "text-pressure-flex" : "",
    stroke ? "text-pressure-stroke" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const inlineMode = !autoFit;

  return (
    <div
      ref={containerRef}
      onPointerEnter={handlePointerEvent}
      onPointerMove={handlePointerEvent}
      onTouchStart={handleTouchEvent}
      onTouchMove={handleTouchEvent}
      style={{
        position: "relative",
        display: inlineMode ? "inline-block" : "block",
        width: inlineMode ? "auto" : "100%",
        height: inlineMode ? "auto" : "100%",
        background: "transparent",
        overflow: "visible",
        lineHeight: inlineMode ? "inherit" : 1,
        verticalAlign: inlineMode ? "baseline" : "top",
      }}
    >
      {styleElement}
      <div
        ref={titleRef}
        className={`text-pressure-title ${dynamicClassName}`}
        style={{
          fontFamily,
          textTransform: "uppercase",
          fontSize: autoFit ? `${fontSize}px` : "1em",
          lineHeight: inlineMode ? "inherit" : lineHeight,
          transform: scaleY !== 1 ? `scale(1, ${scaleY})` : undefined,
          transformOrigin: "center top",
          margin: 0,
          position: inlineMode ? "relative" : undefined,
          top: inlineMode ? "-0.04em" : undefined,
          textAlign: "left",
          userSelect: "none",
          whiteSpace: "nowrap",
          fontWeight: inlineMode ? "inherit" : 100,
          display: "inline-block",
          width: inlineMode ? "auto" : "100%",
          overflow: "visible",
        }}
      >
        {chars.map((char, i) => {
          const initWght = actuationWghtFrom ?? (weight ? 100 : 400);
          const initWdth = actuationWdthFrom ?? (width ? 5 : 100);
          const initItal = actuationItalFrom ?? 0;
          return (
            <span
              key={i}
              ref={(el) => {
                spansRef.current[i] = el;
              }}
              data-char={char}
              style={{
                display: "inline-block",
                color: stroke ? undefined : textColor,
                overflow: "visible",
                fontVariationSettings: `'wght' ${initWght}, 'wdth' ${initWdth}, 'ital' ${initItal}`,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default TextPressure;
