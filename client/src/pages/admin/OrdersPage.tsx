import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminAuth, adminFetch } from "@/lib/admin-auth";
import { ExternalLink } from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  shippingAmount: number;
  shippingMethod: string;
  paymentMethod: string;
  email: string;
  shippingAddress: any;
  trackingNumber: string | null;
  githubIssueNumber: string | null;
  createdAt: string;
}

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const statusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const { token } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [editing, setEditing] = useState<{ status: string; tracking: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const githubRepo = import.meta.env.VITE_GITHUB_REPO as string | undefined;

  useEffect(() => {
    adminFetch("/api/admin/orders", token)
      .then((r) => r.json())
      .then((data) => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const openOrder = (o: Order) => {
    setSelected(o);
    setEditing({ status: o.status, tracking: o.trackingNumber || "" });
  };

  const saveOrder = async () => {
    if (!selected || !editing) return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/orders/${selected.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ status: editing.status, trackingNumber: editing.tracking || null }),
      });
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => o.id === selected.id ? { ...o, ...updated } : o));
      setSelected((s) => s ? { ...s, ...updated } : s);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <h1 className="font-serif text-3xl text-[#2C2826] mb-8">Ordini</h1>

      <div className="bg-white border border-[#E8E3DC] overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#2C2826] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-[#8B8680] p-6">Nessun ordine.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E3DC] bg-[#FAF8F5]">
                {["Numero", "Email", "Totale", "Spedizione", "Pagamento", "Stato", "Data", ""].map((h) => (
                  <th key={h} className="text-left text-xs text-[#8B8680] font-normal px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-[#F0EBE3] last:border-0 hover:bg-[#FAF8F5]">
                  <td className="px-4 py-3 font-mono text-[#2C2826] whitespace-nowrap">
                    {o.orderNumber}
                    {o.githubIssueNumber && githubRepo && (
                      <a
                        href={`https://github.com/${githubRepo}/issues/${o.githubIssueNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-[#7C6B8A] inline-flex"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#8B8680]">{o.email}</td>
                  <td className="px-4 py-3">€ {o.total.toFixed(2).replace(".", ",")}</td>
                  <td className="px-4 py-3 text-[#8B8680]">{o.shippingMethod}</td>
                  <td className="px-4 py-3 text-[#8B8680]">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[o.status] || "bg-gray-100 text-gray-600"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8B8680] whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openOrder(o)}
                      className="text-xs text-[#7C6B8A] hover:underline"
                    >
                      Modifica
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order detail panel */}
      {selected && editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-xl text-[#2C2826] mb-1">Ordine {selected.orderNumber}</h2>
            <p className="text-sm text-[#8B8680] mb-6">{selected.email}</p>

            <div className="mb-4">
              <p className="text-xs text-[#8B8680] uppercase tracking-[0.15em] mb-1">Indirizzo</p>
              <p className="text-sm text-[#2C2826]">
                {selected.shippingAddress.firstName} {selected.shippingAddress.lastName}<br />
                {selected.shippingAddress.address}<br />
                {selected.shippingAddress.city}, {selected.shippingAddress.postalCode}<br />
                {selected.shippingAddress.country}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Stato</label>
                <select
                  value={editing.status}
                  onChange={(e) => setEditing((p) => p ? { ...p, status: e.target.value } : p)}
                  className="w-full border border-[#E8E3DC] px-3 py-2 text-sm text-[#2C2826] focus:outline-none focus:border-[#8B8680]"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8B8680] uppercase tracking-[0.15em] block mb-1">Tracking</label>
                <input
                  value={editing.tracking}
                  onChange={(e) => setEditing((p) => p ? { ...p, tracking: e.target.value } : p)}
                  placeholder="Codice tracking"
                  className="w-full border border-[#E8E3DC] px-3 py-2 text-sm text-[#2C2826] focus:outline-none focus:border-[#8B8680]"
                />
              </div>
            </div>

            {selected.githubIssueNumber && githubRepo && (
              <p className="text-sm text-[#7C6B8A] mb-4">
                <a
                  href={`https://github.com/${githubRepo}/issues/${selected.githubIssueNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  GitHub Issue #{selected.githubIssueNumber}
                </a>
              </p>
            )}

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => { setSelected(null); setEditing(null); }}
                className="text-sm text-[#8B8680] px-4 py-2 border border-[#E8E3DC] hover:border-[#8B8680]"
              >
                Annulla
              </button>
              <button
                onClick={saveOrder}
                disabled={saving}
                className="text-sm bg-[#2C2826] text-white px-6 py-2 hover:bg-[#3C3835] disabled:opacity-50"
              >
                {saving ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
