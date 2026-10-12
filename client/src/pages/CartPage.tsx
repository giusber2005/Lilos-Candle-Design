import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { RandomImage } from "@/components/RandomImage";

interface Variant {
  id: number;
  color: string;
  aroma: string;
  colorHex: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
}

interface CartItem {
  id: number;
  quantity: number;
  product: Product;
  variant: Variant;
}

interface Cart {
  id: number;
  items: CartItem[];
  total: number;
  itemCount: number;
}



export default function CartPage() {
  const { sessionId, refreshCount } = useCart();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Carrello – LilosCandle";
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/cart?sessionId=${sessionId}`);
      const data = await r.json();
      setCart(r.ok && Array.isArray(data?.items) ? data : null);
    } catch {}
    setLoading(false);
  };

  const updateQty = async (itemId: number, qty: number) => {
    try {
      const r = await fetch(`/api/cart/item/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      if (!r.ok) return;
      const data = await r.json();
      setCart(data);
      refreshCount();
    } catch {}
  };

  const removeItem = async (itemId: number) => {
    try {
      const r = await fetch(`/api/cart/item/${itemId}`, { method: "DELETE" });
      if (!r.ok) return;
      const data = await r.json();
      setCart(data);
      refreshCount();
    } catch {}
  };

  const shipping =
    cart && cart.total >= 50
      ? 0
      : cart && cart.total > 0
      ? 4.9
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="w-8 h-8 border-2 border-[#2C2826] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-4xl md:text-5xl text-[#2C2826] mb-12">Carrello</h1>

          {isEmpty ? (
            <div className="text-center py-24">
              <ShoppingBag size={48} className="text-[#C5BEB8] mx-auto mb-6" />
              <h2 className="font-serif text-2xl text-[#2C2826] mb-3">Il tuo carrello è vuoto</h2>
              <p className="text-[#8B8680] font-light mb-8">
                Esplora le nostre candele e aggiungile al carrello.
              </p>
              <Link href="/products">
                <button className="bg-[#2C2826] text-white px-8 py-4 text-sm uppercase tracking-[0.15em] hover:bg-[#3C3835] transition-colors rounded-xl">
                  Vai allo shop
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Items */}
              <div className="lg:col-span-2 space-y-6">
                {cart.items.map((item) => {
                  return (
                    <div key={item.id} className="flex gap-6 pb-6 border-b border-[#E8E3DC]">
                      <div className="relative w-16 h-[72px] bg-[#F0EBE3] flex-shrink-0 rounded-xl overflow-hidden">
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.name} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <RandomImage alt={item.product.name} interval={0} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-serif text-lg text-[#2C2826]">{item.product.name}</h3>
                            <p className="text-xs uppercase tracking-[0.15em] text-[#8B8680] mt-1">
                              {item.variant.color} · {item.variant.aroma}
                            </p>
                          </div>
                          <span className="font-serif text-lg text-[#2C2826] whitespace-nowrap">
                            € {(item.product.price * item.quantity).toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border border-[#E8E3DC] rounded-xl overflow-hidden">
                            <button
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="w-9 h-9 flex items-center justify-center hover:bg-[#F0EBE3] transition-colors"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-10 h-9 flex items-center justify-center text-sm border-x border-[#E8E3DC]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="w-9 h-9 flex items-center justify-center hover:bg-[#F0EBE3] transition-colors"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-[#C5BEB8] hover:text-[#2C2826] transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="bg-[#F0EBE3] p-8 sticky top-24 rounded-2xl">
                  <h2 className="font-serif text-xl text-[#2C2826] mb-6">Riepilogo ordine</h2>
                  <div className="space-y-3 text-sm mb-6 border-b border-[#E8E3DC] pb-6">
                    <div className="flex justify-between">
                      <span className="text-[#8B8680]">Subtotale</span>
                      <span className="text-[#2C2826]">€ {cart.total.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B8680]">Spedizione</span>
                      <span className="text-[#2C2826]">
                        {shipping === 0
                          ? cart.total > 0
                            ? "Gratuita"
                            : "—"
                          : `€ ${shipping.toFixed(2).replace(".", ",")}`}
                      </span>
                    </div>
                    {cart.total < 50 && cart.total > 0 && (
                      <p className="text-xs text-[#7C6B8A] italic">
                        Spedizione gratuita a partire da € 50
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between font-serif text-lg text-[#2C2826] mb-8">
                    <span>Totale</span>
                    <span>€ {(cart.total + shipping).toFixed(2).replace(".", ",")}</span>
                  </div>
                  <Link href="/checkout">
                    <button className="w-full bg-[#2C2826] text-white py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#3C3835] transition-colors flex items-center justify-center gap-3 rounded-xl">
                      Procedi all'acquisto
                      <ArrowRight size={14} />
                    </button>
                  </Link>
                  <Link href="/products">
                    <button className="w-full mt-3 py-3 text-xs uppercase tracking-[0.15em] text-[#8B8680] hover:text-[#2C2826] transition-colors">
                      Continua lo shopping
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
