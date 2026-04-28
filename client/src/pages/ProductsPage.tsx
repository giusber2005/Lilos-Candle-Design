import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

interface Variant {
  id: number;
  color: string;
  colorHex: string;
  aroma: string;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  price: number;
  imageUrl: string | null;
  variants: Variant[];
}

function CandleSVG({ color = "#7C6B8A", size = 280 }: { color?: string; size?: number }) {
  const h = Math.round(size * 1.1);
  return (
    <svg width={size} height={h} viewBox={`0 0 ${size} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={h} rx="3" fill="url(#cement2)" />
      <rect x={size * 0.08} y={size * 0.08} width={size * 0.84} height={h * 0.32} rx="2" fill={color} fillOpacity="0.88" />
      <defs>
        <linearGradient id="cement2" x1="0" y1="0" x2={size} y2={h} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C5BEB8" />
          <stop offset="40%" stopColor="#D8D2CB" />
          <stop offset="70%" stopColor="#BDB6AE" />
          <stop offset="100%" stopColor="#A89E96" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ProductsPage() {
  useScrollReveal();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Shop – LilosCandle";
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const colorMap: Record<string, string> = {
    Viola: "#7C6B8A",
    Purple: "#7C6B8A",
    "Viola Amarena": "#7C6B8A",
  };

  return (
    <div>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 bg-[#FAF8F5]">
        <div className="max-w-6xl mx-auto text-center reveal">
          <p className="text-xs uppercase tracking-[0.3em] text-[#8B8680] mb-4">Tutte le candele</p>
          <h1 className="font-serif text-5xl md:text-6xl text-[#2C2826]">Shop</h1>
          <p className="text-[#8B8680] mt-4 font-light max-w-md mx-auto">
            Ogni candela è unica, modellata a mano in cemento e riempita con cera naturale.
          </p>
        </div>
      </section>

      {/* Product grid */}
      <section className="py-16 px-6 bg-[#FAF8F5] min-h-96">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-[#E8E3DC] aspect-[4/5]" />
                  <div className="pt-5 space-y-2">
                    <div className="h-3 bg-[#E8E3DC] w-1/3 rounded" />
                    <div className="h-6 bg-[#E8E3DC] w-2/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-serif text-2xl text-[#2C2826] mb-4">Nessun prodotto disponibile</p>
              <p className="text-[#8B8680] font-light">Torna presto per scoprire la nostra collezione.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              {products.map((product, i) => {
                const firstVariant = product.variants[0];
                const waxColor = firstVariant
                  ? colorMap[firstVariant.color] || firstVariant.colorHex || "#7C6B8A"
                  : "#7C6B8A";
                return (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <div className={`group cursor-pointer reveal reveal-delay-${i + 1}`}>
                      <div className="bg-[#F0EBE3] aspect-[4/5] flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:shadow-[var(--shadow-lg)]">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="transform group-hover:scale-105 transition-transform duration-700">
                            <CandleSVG color={waxColor} />
                          </div>
                        )}
                      </div>
                      <div className="pt-6 flex items-start justify-between">
                        <div>
                          {firstVariant && (
                            <p className="text-xs uppercase tracking-[0.25em] text-[#8B8680] mb-1">
                              {firstVariant.color} · {firstVariant.aroma}
                            </p>
                          )}
                          <h2 className="font-serif text-2xl text-[#2C2826]">{product.name}</h2>
                          <p className="text-sm text-[#8B8680] mt-1 font-light">{product.shortDescription}</p>
                          {product.variants.length > 1 && (
                            <div className="flex gap-2 mt-3">
                              {product.variants.map((v) => (
                                <div
                                  key={v.id}
                                  className="w-4 h-4 rounded-full border border-[#C5BEB8]"
                                  style={{ backgroundColor: colorMap[v.color] || v.colorHex || "#7C6B8A" }}
                                  title={v.color}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="font-serif text-xl text-[#2C2826] whitespace-nowrap ml-4">
                          € {product.price.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
