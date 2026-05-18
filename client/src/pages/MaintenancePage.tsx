import { useEffect } from "react";

export default function MaintenancePage() {
  useEffect(() => {
    document.title = "Presto di ritorno — LilosCandle";
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "linear-gradient(160deg, #2C2826 0%, #3D3530 50%, #2C2826 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 50% 40%, rgba(124,107,138,0.12) 0%, transparent 65%)" }}
      />

      {/* Candle */}
      <div className="relative mb-14" style={{ width: 56, height: 148 }}>
        {/* Flame */}
        <svg
          className="maintenance-candle-flame"
          width="44"
          height="68"
          viewBox="0 0 44 68"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)" }}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="mf-outer" cx="50%" cy="78%" r="55%">
              <stop offset="0%"   stopColor="#fff9c4" />
              <stop offset="28%"  stopColor="#ffb74d" />
              <stop offset="64%"  stopColor="#e64a19" />
              <stop offset="100%" stopColor="#bf360c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="mf-inner" cx="50%" cy="60%" r="42%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="42%"  stopColor="#fff9c4" />
              <stop offset="100%" stopColor="#ffeb3b" stopOpacity="0.35" />
            </radialGradient>
          </defs>
          {/* Outer flame */}
          <path
            d="M22 67C9 67 1 54 1 43C1 26 22 1 22 1C22 1 43 26 43 43C43 54 35 67 22 67Z"
            fill="url(#mf-outer)"
          />
          {/* Inner core */}
          <path
            d="M22 53C15 53 11 46 11 41C11 32 22 18 22 18C22 18 33 32 33 41C33 46 29 53 22 53Z"
            fill="url(#mf-inner)"
          />
        </svg>
        {/* Wick */}
        <div
          style={{
            position: "absolute",
            top: 65,
            left: "50%",
            transform: "translateX(-50%)",
            width: 3,
            height: 16,
            background: "#3C3835",
            borderRadius: "0 0 2px 2px",
          }}
        />
        {/* Candle body */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 72,
            background: "linear-gradient(to bottom right, #E8E3DC, #D4C9BE)",
            borderRadius: "3px 3px 0 0",
            boxShadow: "inset -2px 0 6px rgba(0,0,0,0.08)",
          }}
        />
      </div>

      {/* Text */}
      <div className="relative z-10">
        <p className="text-[#6B6560] text-xs uppercase tracking-[0.5em] mb-8 font-light">
          LilosCandle
        </p>
        <h1 className="font-serif text-4xl md:text-6xl text-white leading-tight mb-6">
          Siamo temporaneamente
          <br />
          <span className="italic text-[#C5BEB8]">chiusi.</span>
        </h1>
        <p className="text-[#6B6560] text-base md:text-lg font-light max-w-sm mx-auto leading-relaxed">
          Stiamo lavorando per voi. Torneremo presto con qualcosa di speciale.
        </p>

        <div className="mt-16 flex items-center justify-center gap-4">
          <div className="w-10 h-px bg-[#3C3835]" />
          <p className="text-[#4A3D35] text-xs uppercase tracking-[0.35em]">
            Candele artigianali italiane
          </p>
          <div className="w-10 h-px bg-[#3C3835]" />
        </div>
      </div>
    </div>
  );
}
