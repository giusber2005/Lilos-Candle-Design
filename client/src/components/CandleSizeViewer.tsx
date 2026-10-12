import { useEffect, useRef, useState } from "react";
import { Hand, RotateCcw, Move3d } from "lucide-react";

interface Dims {
  w: number; // cm
  d: number;
  h: number;
}

// Accepts "10×12 cm", "10x10x12cm", "Ø 8 x 10 cm", "80 x 120 mm" …
// 1 value → cube, 2 values → square base × height, 3 values → W × D × H.
export function parseDimensions(raw: string | null | undefined): Dims | null {
  if (!raw) return null;
  const nums = (raw.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => parseFloat(n.replace(",", ".")));
  if (nums.length === 0 || nums.some((n) => !(n > 0))) return null;
  const factor = /mm/i.test(raw) ? 0.1 : /\bm\b/i.test(raw) && !/cm/i.test(raw) ? 100 : 1;
  const v = nums.slice(0, 3).map((n) => n * factor);
  const dims = v.length === 1 ? { w: v[0], d: v[0], h: v[0] } : v.length === 2 ? { w: v[0], d: v[0], h: v[1] } : { w: v[0], d: v[1], h: v[2] };
  // ignore obviously wrong values (e.g. a weight typed in the wrong field)
  if (Math.max(dims.w, dims.d, dims.h) > 100) return null;
  return dims;
}

const HAND_HEIGHT_CM = 18.5; // average adult hand, wrist crease to fingertip ≈ 18–19 cm
const HAND_VIEWBOX = { x: -25, y: 0, w: 135, h: 200 }; // 1 unit = 1 mm
const STAGE_HEIGHT = 280; // px available for the tallest object

function HandSilhouette({ pxPerCm }: { pxPerCm: number }) {
  const width = (HAND_VIEWBOX.w / 10) * pxPerCm;
  const height = (HAND_VIEWBOX.h / 10) * pxPerCm;
  const shapes = (
    <>
      {/* thumb */}
      <rect x={-11} y={-72} width={23} height={78} rx={11.5} transform="translate(25 148) rotate(-36)" />
      {/* fingers: index, middle, ring, pinky */}
      <rect x={15} y={18} width={18} height={95} rx={9} />
      <rect x={34} y={5} width={18} height={105} rx={9} />
      <rect x={53} y={14} width={17} height={98} rx={8.5} />
      <rect x={71} y={40} width={15} height={75} rx={7.5} />
      {/* palm + wrist */}
      <rect x={14} y={82} width={72} height={86} rx={20} />
      <rect x={24} y={150} width={52} height={50} rx={6} />
    </>
  );
  return (
    <svg
      width={width}
      height={height}
      viewBox={`${HAND_VIEWBOX.x} ${HAND_VIEWBOX.y} ${HAND_VIEWBOX.w} ${HAND_VIEWBOX.h}`}
      aria-label="Mano di riferimento (circa 18,5 cm)"
      className="block"
    >
      {/* outline drawn under the fill so overlapping shapes read as one silhouette */}
      <g fill="none" stroke="#B9AEA4" strokeWidth={3} strokeLinejoin="round">{shapes}</g>
      <g fill="#EADFD3">{shapes}</g>
      {/* knuckle hints */}
      <g stroke="#D6C8BA" strokeWidth={1.2} strokeLinecap="round" fill="none">
        <path d="M19 60h10M38 50h10M57 56h9M74 76h8" />
        <path d="M30 128c12 6 28 8 44 2" />
      </g>
    </svg>
  );
}

function Face({ style, className = "" }: { style: React.CSSProperties; className?: string }) {
  return <div className={`absolute left-1/2 top-1/2 ${className}`} style={style} />;
}

export function CandleSizeViewer({ dimensions, waxColor }: { dimensions: string; waxColor: string }) {
  const dims = parseDimensions(dimensions);
  const [rot, setRot] = useState({ x: -22, y: -35 });
  const [showHand, setShowHand] = useState(true);
  const [interacted, setInteracted] = useState(false);
  const drag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);

  // gentle idle spin until the visitor grabs the cube
  useEffect(() => {
    if (interacted) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      setRot((r) => ({ ...r, y: r.y + dt * 0.012 }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [interacted]);

  if (!dims) return null;

  const tallest = Math.max(dims.h, showHand ? HAND_VIEWBOX.h / 10 : 0, dims.w, dims.d);
  const pxPerCm = Math.min(STAGE_HEIGHT / tallest, 26);
  const W = dims.w * pxPerCm;
  const D = dims.d * pxPerCm;
  const H = dims.h * pxPerCm;
  const waxDepth = Math.min(H * 0.18, 1.5 * pxPerCm);
  const box = Math.ceil(Math.sqrt(W * W + D * D)); // footprint that fits any Y rotation

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, rx: rot.x, ry: rot.y };
    setInteracted(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setRot({
      x: Math.max(-70, Math.min(10, drag.current.rx - dy * 0.4)),
      y: drag.current.ry + dx * 0.5,
    });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const cement = "linear-gradient(160deg, #D8D2CB 0%, #C5BEB8 45%, #B3AAA1 100%)";
  const cementSide = "linear-gradient(160deg, #C9C2BA 0%, #B3AAA1 60%, #A0968D 100%)";
  const edge = "inset 0 0 0 1px rgba(44,40,38,0.18)";
  const fmt = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 1 });

  // front/back are W×H, left/right are D×H, top/bottom are W×D
  const faces: Array<{ w: number; h: number; t: string; bg: string; wax?: boolean }> = [
    { w: W, h: H, t: `translateZ(${D / 2}px)`, bg: cement, wax: true },
    { w: W, h: H, t: `rotateY(180deg) translateZ(${D / 2}px)`, bg: cementSide, wax: true },
    { w: D, h: H, t: `rotateY(90deg) translateZ(${W / 2}px)`, bg: cementSide, wax: true },
    { w: D, h: H, t: `rotateY(-90deg) translateZ(${W / 2}px)`, bg: cement, wax: true },
    { w: W, h: D, t: `rotateX(90deg) translateZ(${H / 2}px)`, bg: waxColor },
    { w: W, h: D, t: `rotateX(-90deg) translateZ(${H / 2}px)`, bg: "#A0968D" },
  ];

  return (
    <div className="mt-6 bg-white border border-[#E8E3DC] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E3DC]">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">Dimensioni reali</p>
          <p className="text-sm text-[#2C2826] mt-0.5">
            {fmt(dims.w)} × {fmt(dims.d)} × {fmt(dims.h)} cm
            <span className="text-[#8B8680]"> · L × P × A</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHand((v) => !v)}
            aria-pressed={showHand}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 border transition-colors ${
              showHand ? "border-[#2C2826] bg-[#2C2826] text-white" : "border-[#E8E3DC] text-[#8B8680] hover:border-[#8B8680]"
            }`}
          >
            <Hand size={13} /> Mano
          </button>
          <button
            type="button"
            onClick={() => { setRot({ x: -22, y: -35 }); setInteracted(true); }}
            className="p-2 border border-[#E8E3DC] text-[#8B8680] hover:border-[#8B8680] hover:text-[#2C2826] transition-colors"
            aria-label="Ripristina vista"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      <div className="relative bg-gradient-to-b from-[#FAF8F5] to-[#F0EBE3] px-6 pt-10 pb-8">
        <div className="flex items-end justify-center gap-10" style={{ minHeight: STAGE_HEIGHT + 20 }}>
          {/* 3D cube */}
          <div className="flex flex-col items-center">
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative cursor-grab active:cursor-grabbing touch-none select-none"
              style={{ width: box, height: H + D * 0.6, perspective: 900 }}
              title="Trascina per ruotare"
            >
              <div
                className="absolute left-1/2 bottom-0"
                style={{
                  width: 0,
                  height: 0,
                  transformStyle: "preserve-3d",
                  transform: `translateY(${-H / 2 - D * 0.15}px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
                }}
              >
                {faces.map((f, i) => (
                  <Face
                    key={i}
                    className="rounded-[3px]"
                    style={{
                      width: f.w,
                      height: f.h,
                      marginLeft: -f.w / 2,
                      marginTop: -f.h / 2,
                      transform: f.t,
                      background: f.wax
                        ? `linear-gradient(to bottom, ${waxColor} 0, ${waxColor} ${waxDepth}px, transparent ${waxDepth}px), ${f.bg}`
                        : f.bg,
                      boxShadow: edge,
                      backfaceVisibility: "hidden",
                    }}
                  />
                ))}
              </div>
            </div>
            {/* floor shadow */}
            <div className="rounded-[50%] bg-[#2C2826]/10 blur-sm -mt-1" style={{ width: box * 0.9, height: 10 }} />
            <p className="text-xs text-[#8B8680] mt-3">Candela</p>
          </div>

          {showHand && (
            <div className="flex flex-col items-center">
              <HandSilhouette pxPerCm={pxPerCm} />
              <div className="-mt-1" style={{ height: 10 }} />
              <p className="text-xs text-[#8B8680] mt-3">Mano ≈ {fmt(HAND_HEIGHT_CM)} cm</p>
            </div>
          )}
        </div>

        {/* scale bar */}
        <div className="absolute left-5 bottom-4 flex flex-col items-start gap-1" aria-hidden>
          <div className="h-1.5 border-x border-b border-[#8B8680] rounded-b-sm" style={{ width: 5 * pxPerCm }} />
          <span className="text-[10px] text-[#8B8680]">5 cm</span>
        </div>
        {!interacted && (
          <div className="absolute right-5 bottom-4 flex items-center gap-1.5 text-[11px] text-[#8B8680]">
            <Move3d size={13} /> Trascina per ruotare
          </div>
        )}
      </div>
    </div>
  );
}
