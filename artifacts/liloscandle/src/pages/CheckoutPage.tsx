import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { CreditCard, Package, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";

interface CartSummary {
  total: number;
  itemCount: number;
  items: {
    id: number;
    quantity: number;
    product: { name: string; price: number };
    variant: { color: string; aroma: string };
  }[];
}

const shippingMethods = [
  { id: "standard", label: "Standard", desc: "3–5 giorni lavorativi", price: 4.9 },
  { id: "express", label: "Express", desc: "1–2 giorni lavorativi", price: 9.9 },
];

const paymentMethods = [
  { id: "card", label: "Carta di credito", icon: "💳" },
  { id: "paypal", label: "PayPal", icon: "🅿️" },
  { id: "apple_pay", label: "Apple Pay", icon: "🍎" },
  { id: "google_pay", label: "Google Pay", icon: "G" },
];

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { sessionId, refreshCount } = useCart();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Italia",
  });
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    document.title = "Checkout – LilosCandle";
    fetch(`/api/cart?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then(setCart)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedShipping = shippingMethods.find((s) => s.id === shippingMethod);
  const subtotal = cart?.total || 0;
  const shippingCost = subtotal >= 50 ? 0 : selectedShipping?.price || 4.9;
  const total = subtotal + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.itemCount === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          shippingAddress: form,
          shippingMethod,
          paymentMethod,
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error("Order failed");
      const order = await res.json();
      refreshCount();
      navigate(`/order/${order.id}`);
    } catch {
      alert("Errore durante il checkout. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="w-8 h-8 border-2 border-[#2C2826] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cart || cart.itemCount === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-16 px-6">
        <h2 className="font-serif text-2xl text-[#2C2826] mb-4">Il carrello è vuoto</h2>
        <Link href="/products">
          <button className="text-sm text-[#8B8680] underline hover:text-[#2C2826]">
            Vai allo shop
          </button>
        </Link>
      </div>
    );
  }

  const inputCls =
    "w-full border border-[#E8E3DC] bg-white px-4 py-3 text-sm text-[#2C2826] placeholder-[#C5BEB8] focus:outline-none focus:border-[#8B8680] transition-colors";

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-4xl text-[#2C2826] mb-12">Checkout</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left: forms */}
              <div className="lg:col-span-2 space-y-12">
                {/* Shipping address */}
                <div>
                  <h2 className="text-xs uppercase tracking-[0.25em] text-[#8B8680] mb-6 flex items-center gap-2">
                    <Package size={14} />
                    Indirizzo di spedizione
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      name="firstName"
                      placeholder="Nome *"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                    <input
                      name="lastName"
                      placeholder="Cognome *"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                    <input
                      name="email"
                      type="email"
                      placeholder="Email *"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className={`${inputCls} col-span-2`}
                    />
                    <input
                      name="phone"
                      placeholder="Telefono"
                      value={form.phone}
                      onChange={handleChange}
                      className={`${inputCls} col-span-2`}
                    />
                    <input
                      name="address"
                      placeholder="Indirizzo *"
                      value={form.address}
                      onChange={handleChange}
                      required
                      className={`${inputCls} col-span-2`}
                    />
                    <input
                      name="city"
                      placeholder="Città *"
                      value={form.city}
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                    <input
                      name="postalCode"
                      placeholder="CAP *"
                      value={form.postalCode}
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                    <select
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      required
                      className={`${inputCls} col-span-2 appearance-none cursor-pointer`}
                    >
                      <option>Italia</option>
                      <option>Francia</option>
                      <option>Germania</option>
                      <option>Spagna</option>
                      <option>Svizzera</option>
                      <option>Austria</option>
                    </select>
                  </div>
                </div>

                {/* Shipping method */}
                <div>
                  <h2 className="text-xs uppercase tracking-[0.25em] text-[#8B8680] mb-6">Metodo di spedizione</h2>
                  <div className="space-y-3">
                    {shippingMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${
                          shippingMethod === method.id
                            ? "border-[#2C2826] bg-white"
                            : "border-[#E8E3DC] bg-white hover:border-[#8B8680]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            value={method.id}
                            checked={shippingMethod === method.id}
                            onChange={() => setShippingMethod(method.id)}
                            className="accent-[#2C2826]"
                          />
                          <div>
                            <p className="text-sm font-medium text-[#2C2826]">{method.label}</p>
                            <p className="text-xs text-[#8B8680]">{method.desc}</p>
                          </div>
                        </div>
                        <span className="text-sm text-[#2C2826]">
                          {subtotal >= 50 ? "Gratuita" : `€ ${method.price.toFixed(2).replace(".", ",")}`}
                        </span>
                      </label>
                    ))}
                    {subtotal < 50 && (
                      <p className="text-xs text-[#7C6B8A] italic px-1">
                        Spedizione gratuita per ordini superiori a € 50
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <h2 className="text-xs uppercase tracking-[0.25em] text-[#8B8680] mb-6 flex items-center gap-2">
                    <CreditCard size={14} />
                    Metodo di pagamento
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((pm) => (
                      <label
                        key={pm.id}
                        className={`flex items-center gap-3 p-4 border cursor-pointer transition-all ${
                          paymentMethod === pm.id
                            ? "border-[#2C2826] bg-white"
                            : "border-[#E8E3DC] bg-white hover:border-[#8B8680]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={pm.id}
                          checked={paymentMethod === pm.id}
                          onChange={() => setPaymentMethod(pm.id)}
                          className="accent-[#2C2826]"
                        />
                        <span className="text-lg">{pm.icon}</span>
                        <span className="text-sm text-[#2C2826]">{pm.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-[#8B8680] mt-3 italic">
                    Il pagamento sicuro sarà elaborato tramite Stripe / PayPal.
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <h2 className="text-xs uppercase tracking-[0.25em] text-[#8B8680] mb-4">Note aggiuntive</h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Istruzioni speciali per la consegna (opzionale)"
                    rows={3}
                    className="w-full border border-[#E8E3DC] bg-white px-4 py-3 text-sm text-[#2C2826] placeholder-[#C5BEB8] focus:outline-none focus:border-[#8B8680] transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Right: order summary */}
              <div className="lg:col-span-1">
                <div className="bg-[#F0EBE3] p-8 sticky top-24">
                  <h2 className="font-serif text-xl text-[#2C2826] mb-6">Il tuo ordine</h2>
                  <div className="space-y-4 mb-6 pb-6 border-b border-[#E8E3DC]">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="text-[#2C2826] font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-[#8B8680]">
                            {item.variant.color} · {item.variant.aroma} × {item.quantity}
                          </p>
                        </div>
                        <span className="text-[#2C2826] whitespace-nowrap">
                          € {(item.product.price * item.quantity).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm mb-6 pb-6 border-b border-[#E8E3DC]">
                    <div className="flex justify-between">
                      <span className="text-[#8B8680]">Subtotale</span>
                      <span>€ {subtotal.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B8680]">Spedizione</span>
                      <span>{shippingCost === 0 ? "Gratuita" : `€ ${shippingCost.toFixed(2).replace(".", ",")}`}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-serif text-lg text-[#2C2826] mb-8">
                    <span>Totale</span>
                    <span>€ {total.toFixed(2).replace(".", ",")}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#2C2826] text-white py-4 text-sm uppercase tracking-[0.2em] hover:bg-[#3C3835] transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Elaborazione...
                      </span>
                    ) : (
                      <>
                        Conferma ordine
                        <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
