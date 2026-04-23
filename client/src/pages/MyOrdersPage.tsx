import { useState } from "react";
import { Link } from "wouter";
import { Search, ChevronRight, Package } from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: { productName: string; quantity: number }[];
}

const statusLabels: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  processing: "In preparazione",
  shipped: "Spedito",
  delivered: "Consegnato",
  cancelled: "Annullato",
};

const statusColors: Record<string, string> = {
  pending: "bg-[#F0EBE3] text-[#8B8680]",
  confirmed: "bg-[#7C6B8A]/10 text-[#7C6B8A]",
  processing: "bg-[#7C6B8A]/20 text-[#7C6B8A]",
  shipped: "bg-[#2C2826]/10 text-[#2C2826]",
  delivered: "bg-[#2C2826]/20 text-[#2C2826]",
  cancelled: "bg-red-50 text-red-500",
};

export default function MyOrdersPage() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/orders?email=${encodeURIComponent(email)}`);
      const data = await r.json();
      setOrders(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch {
      setError("Errore nel caricamento degli ordini. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B8680] mb-4">Storico</p>
            <h1 className="font-serif text-4xl md:text-5xl text-[#2C2826]">I miei ordini</h1>
            <p className="text-[#8B8680] mt-4 font-light">
              Inserisci l'email con cui hai effettuato l'ordine per visualizzare la cronologia.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3 mb-12">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="La tua email"
              required
              className="flex-1 border border-[#E8E3DC] bg-white px-5 py-4 text-sm text-[#2C2826] placeholder-[#C5BEB8] focus:outline-none focus:border-[#8B8680] transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2C2826] text-white px-6 py-4 hover:bg-[#3C3835] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search size={16} />
              )}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-8">
              {error}
            </div>
          )}

          {searched && (
            <>
              {orders.length === 0 ? (
                <div className="text-center py-16">
                  <Package size={40} className="text-[#C5BEB8] mx-auto mb-5" />
                  <h2 className="font-serif text-xl text-[#2C2826] mb-3">Nessun ordine trovato</h2>
                  <p className="text-[#8B8680] font-light text-sm">
                    Non abbiamo trovato ordini associati a questa email.
                  </p>
                  <Link href="/products">
                    <button className="mt-6 text-sm text-[#7C6B8A] underline hover:text-[#2C2826] transition-colors">
                      Vai allo shop →
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[#8B8680] mb-6">
                    {orders.length} ordine{orders.length !== 1 ? "i" : ""} trovato{orders.length !== 1 ? "i" : ""}
                  </p>
                  {orders.map((order) => (
                    <Link key={order.id} href={`/order/${order.id}`}>
                      <div className="bg-white border border-[#E8E3DC] p-6 hover:border-[#8B8680] transition-colors cursor-pointer flex items-center justify-between gap-4 group">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-serif text-lg text-[#2C2826]">{order.orderNumber}</span>
                            <span
                              className={`text-xs px-2 py-0.5 uppercase tracking-[0.1em] ${
                                statusColors[order.status] || "bg-[#F0EBE3] text-[#8B8680]"
                              }`}
                            >
                              {statusLabels[order.status] || order.status}
                            </span>
                          </div>
                          <p className="text-sm text-[#8B8680] font-light truncate">
                            {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                          </p>
                          <p className="text-xs text-[#C5BEB8] mt-1">
                            {new Date(order.createdAt).toLocaleDateString("it-IT", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className="font-serif text-lg text-[#2C2826]">
                            € {order.totalAmount.toFixed(2).replace(".", ",")}
                          </span>
                          <ChevronRight
                            size={16}
                            className="text-[#C5BEB8] group-hover:text-[#2C2826] group-hover:translate-x-1 transition-all"
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
