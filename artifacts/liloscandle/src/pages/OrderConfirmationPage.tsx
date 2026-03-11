import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { CheckCircle, Package } from "lucide-react";

interface OrderItem {
  id: number;
  productName: string;
  variantColor: string;
  variantAroma: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  shippingAmount: number;
  shippingMethod: string;
  paymentMethod: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  trackingNumber: string | null;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  processing: "In preparazione",
  shipped: "Spedito",
  delivered: "Consegnato",
  cancelled: "Annullato",
};

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Ordine confermato – LilosCandle";
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="w-8 h-8 border-2 border-[#2C2826] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-16 px-6">
        <h2 className="font-serif text-2xl text-[#2C2826] mb-4">Ordine non trovato</h2>
        <Link href="/products">
          <button className="text-sm text-[#8B8680] underline hover:text-[#2C2826]">Vai allo shop</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success */}
          <div className="mb-12">
            <CheckCircle size={56} className="text-[#7C6B8A] mx-auto mb-6" />
            <h1 className="font-serif text-4xl text-[#2C2826] mb-4">Grazie per il tuo ordine!</h1>
            <p className="text-[#8B8680] font-light text-lg">
              Il tuo ordine è stato confermato. Riceverai un'email di conferma a{" "}
              <strong className="text-[#2C2826]">{order.shippingAddress.email}</strong>.
            </p>
          </div>

          {/* Order card */}
          <div className="bg-[#F0EBE3] p-8 text-left mb-8">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E8E3DC]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-1">Numero ordine</p>
                <p className="font-serif text-xl text-[#2C2826]">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-1">Stato</p>
                <span className="inline-block bg-[#7C6B8A] text-white text-xs px-3 py-1 uppercase tracking-[0.1em]">
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4 mb-6 pb-6 border-b border-[#E8E3DC]">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <p className="text-[#2C2826] font-medium">{item.productName}</p>
                    <p className="text-xs text-[#8B8680]">
                      {item.variantColor} · {item.variantAroma} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-[#2C2826]">
                    € {(item.unitPrice * item.quantity).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm mb-6 pb-6 border-b border-[#E8E3DC]">
              <div className="flex justify-between">
                <span className="text-[#8B8680]">Spedizione</span>
                <span>{order.shippingAmount === 0 ? "Gratuita" : `€ ${order.shippingAmount.toFixed(2).replace(".", ",")}`}</span>
              </div>
            </div>
            <div className="flex justify-between font-serif text-lg text-[#2C2826]">
              <span>Totale</span>
              <span>€ {order.totalAmount.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>

          {/* Shipping info */}
          <div className="bg-white border border-[#E8E3DC] p-6 text-left mb-8 flex gap-4">
            <Package size={20} className="text-[#8B8680] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#2C2826] mb-1">Indirizzo di consegna</p>
              <p className="text-sm text-[#8B8680] font-light">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                <br />
                {order.shippingAddress.address}
                <br />
                {order.shippingAddress.postalCode} {order.shippingAddress.city}, {order.shippingAddress.country}
              </p>
              {order.trackingNumber && (
                <p className="text-xs text-[#7C6B8A] mt-2">
                  Tracking: <strong>{order.trackingNumber}</strong>
                </p>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <button className="bg-[#2C2826] text-white px-8 py-4 text-sm uppercase tracking-[0.15em] hover:bg-[#3C3835] transition-colors">
                Continua lo shopping
              </button>
            </Link>
            <Link href="/orders">
              <button className="border border-[#2C2826] text-[#2C2826] px-8 py-4 text-sm uppercase tracking-[0.15em] hover:bg-[#F0EBE3] transition-colors">
                I miei ordini
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
