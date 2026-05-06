import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, MoreHorizontal, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useContent } from "@/lib/content-context";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { itemCount } = useCart();
  const [location] = useLocation();
  const c = useContent();

  const brandName = c["brand_name"] || "LilosCandle";
  const brandTagline = c["brand_tagline"] || "Luce. Profumo. Artigianato.";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isLight = location === "/" && !scrolled;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || location !== "/"
            ? "bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E3DC] shadow-[var(--shadow-xs)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-2.5 cursor-pointer">
              {/* Animated candle icon */}
              <span className="relative flex-shrink-0" style={{ width: 13, height: 28 }}>
                {/* Flame SVG */}
                <svg
                  className="navbar-candle-flame"
                  width="11"
                  height="16"
                  viewBox="0 0 11 16"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)" }}
                  aria-hidden="true"
                >
                  <defs>
                    <radialGradient id="nf-outer" cx="50%" cy="78%" r="55%">
                      <stop offset="0%"   stopColor="#fff9c4" />
                      <stop offset="32%"  stopColor="#ffb74d" />
                      <stop offset="68%"  stopColor="#e64a19" />
                      <stop offset="100%" stopColor="#bf360c" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="nf-inner" cx="50%" cy="62%" r="44%">
                      <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="50%"  stopColor="#fff9c4" />
                      <stop offset="100%" stopColor="#ffeb3b" stopOpacity="0.3" />
                    </radialGradient>
                  </defs>
                  {/* Outer flame */}
                  <path
                    d="M5.5 15.5C3 15.5 1 12.5 1 10.2C1 6.5 5.5 1 5.5 1C5.5 1 10 6.5 10 10.2C10 12.5 8 15.5 5.5 15.5Z"
                    fill="url(#nf-outer)"
                  />
                  {/* Inner core */}
                  <path
                    d="M5.5 13C4.2 13 3.5 11.7 3.5 10.6C3.5 8.8 5.5 6 5.5 6C5.5 6 7.5 8.8 7.5 10.6C7.5 11.7 6.8 13 5.5 13Z"
                    fill="url(#nf-inner)"
                  />
                </svg>
                {/* Wick */}
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 1.5,
                    height: 6,
                    background: "#4A3D35",
                    borderRadius: "0 0 1px 1px",
                  }}
                />
                {/* Candle body stub */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 1,
                    right: 1,
                    height: 9,
                    borderRadius: "1px 1px 0 0",
                    background: isLight ? "rgba(255,255,255,0.22)" : "rgba(197,190,184,0.4)",
                    border: `1px solid ${isLight ? "rgba(255,255,255,0.12)" : "rgba(180,172,165,0.25)"}`,
                  }}
                />
              </span>

              {/* Brand name */}
              <span
                className={`navbar-brand-text font-serif text-xl tracking-widest uppercase transition-colors duration-300 ${
                  isLight ? "text-white" : "text-[#2C2826]"
                }`}
              >
                {brandName}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/cart">
              <button
                className={`relative p-2 rounded-full transition-colors ${
                  isLight ? "text-white hover:bg-white/10" : "text-[#2C2826] hover:bg-[#F0EBE3]"
                }`}
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#7C6B8A] text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>
            </Link>

            <button
              onClick={() => setMenuOpen(true)}
              className={`p-2 rounded-full transition-colors ${
                isLight ? "text-white hover:bg-white/10" : "text-[#2C2826] hover:bg-[#F0EBE3]"
              }`}
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-80 bg-[#FAF8F5] shadow-[var(--shadow-2xl)] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#E8E3DC]">
              <span className="font-serif text-lg text-[#2C2826]">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 hover:bg-[#F0EBE3] rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col p-6 gap-1">
              {[
                { href: "/products", label: "Shop" },
                { href: "/orders", label: "I miei ordini" },
                { href: "/about", label: "Chi siamo" },
                { href: "/how-made", label: "Come sono fatte le candele" },
              ].map(({ href, label }) => (
                <Link key={href} href={href}>
                  <span className="block py-3 px-4 text-[#2C2826] font-medium hover:bg-[#F0EBE3] rounded-lg transition-colors cursor-pointer">
                    {label}
                  </span>
                </Link>
              ))}
            </nav>
            <div className="mt-auto p-6 border-t border-[#E8E3DC]">
              <p className="text-sm text-[#8B8680] font-serif italic">{brandTagline}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
