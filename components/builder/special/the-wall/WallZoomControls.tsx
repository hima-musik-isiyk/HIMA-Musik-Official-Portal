"use client";

interface WallZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export default function WallZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
}: WallZoomControlsProps) {
  return (
    <div className="pointer-events-auto fixed bottom-6 left-6 z-40 flex flex-col border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
      <button
        onClick={onZoomIn}
        className="flex items-center justify-center border-b border-white/10 p-3 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Zoom In"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <button
        onClick={onReset}
        className="text-gold-500 hover:text-gold-300 border-b border-white/10 px-3 py-2 text-center text-xs font-medium transition-colors hover:bg-white/10"
        aria-label="Reset Zoom"
      >
        {Math.round(scale * 100)}%
      </button>

      <button
        onClick={onZoomOut}
        className="flex items-center justify-center p-3 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Zoom Out"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
}
