import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, MoreHorizontal, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { itemCount } = useCart();
  const [location] = useLocation();

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
          {/* Logo */}
          <Link href="/">
            <span
              className={`font-serif text-xl tracking-widest uppercase cursor-pointer transition-colors duration-300 ${
                isLight ? "text-white" : "text-[#2C2826]"
              }`}
            >
              LilosCandle
            </span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <Link href="/cart">
              <button
                className={`relative p-2 rounded-full transition-colors ${
                  isLight
                    ? "text-white hover:bg-white/10"
                    : "text-[#2C2826] hover:bg-[#F0EBE3]"
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
                isLight
                  ? "text-white hover:bg-white/10"
                  : "text-[#2C2826] hover:bg-[#F0EBE3]"
              }`}
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay menu */}
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
              <p className="text-sm text-[#8B8680] font-serif italic">
                Luce. Profumo. Artigianato.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
