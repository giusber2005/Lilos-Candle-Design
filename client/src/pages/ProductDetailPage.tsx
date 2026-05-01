import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Minus, Plus, ShoppingBag, ArrowLeft, ZoomIn } from "lucide-react";
import { useCart } from "@/lib/cart-context";

interface Variant {
  id: number;
  productId: number;
  color: string;
  colorHex: string;
  aroma: string;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  imageUrl: string | null;
  images: string[];
  size: string;
  material: string;
  burnTime: string;
  weight: string;
  dimensions: string;
  variants: Variant[];
  featured: boolean;
}

function CandleSVG({ color = "#7C6B8A", large = false }: { color?: string; large?: boolean }) {
  const w = large ? 320 : 200;
  const h = large ? 360 : 224;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width={w} height={h} rx="4" fill="url(#cDetail)" />
      <rect x={w * 0.08} y={w * 0.08} width={w * 0.84} height={h * 0.32} rx="2" fill={color} fillOpacity="0.9" />
      <defs>
        <linearGradient id="cDetail" x1="0" y1="0" x2={w} y2={h} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C5BEB8" />
          <stop offset="30%" stopColor="#D8D2CB" />
          <stop offset="60%" stopColor="#C2BBB3" />
          <stop offset="100%" stopColor="#A89E96" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const colorMap: Record<string, string> = {
  Viola: "#7C6B8A",
  Purple: "#7C6B8A",
};

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [zoom, setZoom] = useState(false);
  const { sessionId, refreshCount } = useCart();

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((products: Product[]) => {
        const p = products.find((x) => x.slug === slug);
        if (!p) {
          setNotFound(true);
        } else {
          setProduct(p);
          if (p.variants.length > 0) setSelectedVariant(p.variants[0]);
          document.title = `${p.name} – LilosCandle`;
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;
    setAdding(true);
    try {
      const r = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          productId: product.id,
          variantId: selectedVariant.id,
          quantity,
        }),
      });
      if (!r.ok) throw new Error("Errore nell'aggiunta al carrello.");
      setAdded(true);
      refreshCount();
      setTimeout(() => setAdded(false), 2500);
    } catch {
      alert("Errore nell'aggiunta al carrello. Riprova.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="w-8 h-8 border-2 border-[#2C2826] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-16 px-6">
        <h1 className="font-serif text-3xl text-[#2C2826] mb-4">Prodotto non trovato</h1>
        <Link href="/products">
          <button className="text-sm text-[#8B8680] underline hover:text-[#2C2826] transition-colors">
            Torna allo shop
          </button>
        </Link>
      </div>
    );
  }

  const waxColor = selectedVariant
    ? colorMap[selectedVariant.color] || selectedVariant.colorHex || "#7C6B8A"
    : "#7C6B8A";

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back */}
          <Link href="/products">
            <button className="flex items-center gap-2 text-sm text-[#8B8680] hover:text-[#2C2826] transition-colors mb-12 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Torna allo shop
            </button>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* Images */}
            <div>
              <div
                className="bg-[#F0EBE3] aspect-square flex items-center justify-center relative group cursor-zoom-in overflow-hidden"
                onClick={() => setZoom(true)}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="transform group-hover:scale-105 transition-transform duration-700">
                    <CandleSVG color={waxColor} large />
                  </div>
                )}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn size={18} className="text-[#8B8680]" />
                </div>
              </div>
              {/* Thumbnails */}
              {product.images.length > 0 ? (
                <div className="flex gap-3 mt-4">
                  {product.images.map((url, i) => (
                    <div key={i} className="w-20 h-20 bg-[#F0EBE3] border border-[#E8E3DC] cursor-pointer hover:border-[#2C2826] transition-colors overflow-hidden">
                      <img src={url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : product.imageUrl ? (
                <div className="flex gap-3 mt-4">
                  <div className="w-20 h-20 bg-[#F0EBE3] border border-[#2C2826] overflow-hidden">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8B8680] mb-3">
                Candela artigianale · Cemento
              </p>
              <h1 className="font-serif text-4xl md:text-5xl text-[#2C2826] mb-4">{product.name}</h1>
              <div className="flex items-baseline gap-3 mb-8">
                <span className="font-serif text-3xl text-[#2C2826]">
                  € {product.price.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <p className="text-[#6B6560] leading-relaxed mb-10 font-light">{product.description}</p>

              {/* Variant selector */}
              {product.variants.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-4">
                    Variante: {selectedVariant?.color} · {selectedVariant?.aroma}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {product.variants.map((v) => {
                      const c = colorMap[v.color] || v.colorHex || "#7C6B8A";
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`flex items-center gap-2 px-4 py-2 border text-sm transition-all ${
                            selectedVariant?.id === v.id
                              ? "border-[#2C2826] bg-[#F0EBE3]"
                              : "border-[#E8E3DC] hover:border-[#8B8680]"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: c }}
                          />
                          {v.color} · {v.aroma}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-4">Quantità</p>
                <div className="flex items-center gap-0 border border-[#E8E3DC] w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-[#F0EBE3] transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 h-11 flex items-center justify-center font-medium text-sm border-x border-[#E8E3DC]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-11 h-11 flex items-center justify-center hover:bg-[#F0EBE3] transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleAddToCart}
                disabled={adding || !selectedVariant}
                className={`w-full py-4 text-sm uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-3 transition-all duration-300 ${
                  added
                    ? "bg-[#7C6B8A] text-white"
                    : "bg-[#2C2826] text-white hover:bg-[#3C3835]"
                } disabled:opacity-50`}
              >
                <ShoppingBag size={16} />
                {adding ? "Aggiunta..." : added ? "Aggiunto al carrello ✓" : "Aggiungi al carrello"}
              </button>

              <div className="mt-4 text-center">
                <Link href="/cart">
                  <button className="text-xs text-[#8B8680] underline hover:text-[#2C2826] transition-colors">
                    Vai al carrello
                  </button>
                </Link>
              </div>

              {/* Specs */}
              <div className="mt-12 border-t border-[#E8E3DC] pt-8">
                <h3 className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-5">Specifiche</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { label: "Dimensioni", value: product.dimensions },
                    { label: "Materiale", value: product.material },
                    { label: "Durata", value: product.burnTime },
                    { label: "Peso", value: product.weight },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-[#8B8680] uppercase tracking-[0.1em] mb-1">{label}</p>
                      <p className="text-sm text-[#2C2826] font-light">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom overlay */}
      {zoom && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center cursor-zoom-out"
          onClick={() => setZoom(false)}
        >
          <CandleSVG color={waxColor} large />
        </div>
      )}
    </div>
  );
}
