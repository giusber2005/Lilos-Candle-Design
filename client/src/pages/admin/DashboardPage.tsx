import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminAuth, adminFetch } from "@/lib/admin-auth";
import { TrendingUp, Package, ShoppingBag, Mail } from "lucide-react";

interface Stats {
  orders: number;
  products: number;
  subscribers: number;
  revenue: number;
  recentOrders: {
    id: number;
    orderNumber: string;
    status: string;
    total: number;
    email: string;
    createdAt: string;
  }[];
}

const statusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/dashboard", token)
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, [token]);

  const cards = stats
    ? [
        { label: "Ordini totali", value: stats.orders, icon: ShoppingBag },
        { label: "Prodotti", value: stats.products, icon: Package },
        { label: "Iscritti newsletter", value: stats.subscribers, icon: Mail },
        {
          label: "Fatturato",
          value: `€ ${stats.revenue.toFixed(2).replace(".", ",")}`,
          icon: TrendingUp,
        },
      ]
    : [];

  return (
    <AdminLayout>
      <h1 className="font-serif text-3xl text-[#2C2826] mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-[#E8E3DC] p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-[0.15em] text-[#8B8680]">{label}</p>
              <Icon size={16} className="text-[#C5BEB8]" />
            </div>
            <p className="font-serif text-2xl text-[#2C2826]">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E8E3DC] p-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-5">Ordini recenti</h2>
        {!stats ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#2C2826] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats.recentOrders.length === 0 ? (
          <p className="text-sm text-[#8B8680]">Nessun ordine ancora.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E3DC]">
                <th className="text-left text-xs text-[#8B8680] font-normal pb-2">Numero</th>
                <th className="text-left text-xs text-[#8B8680] font-normal pb-2">Email</th>
                <th className="text-left text-xs text-[#8B8680] font-normal pb-2">Totale</th>
                <th className="text-left text-xs text-[#8B8680] font-normal pb-2">Stato</th>
                <th className="text-left text-xs text-[#8B8680] font-normal pb-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-[#F0EBE3] last:border-0">
                  <td className="py-3 font-mono text-[#2C2826]">{o.orderNumber}</td>
                  <td className="py-3 text-[#8B8680]">{o.email}</td>
                  <td className="py-3">€ {o.total.toFixed(2).replace(".", ",")}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[o.status] || "bg-gray-100 text-gray-600"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 text-[#8B8680]">
                    {new Date(o.createdAt).toLocaleDateString("it-IT")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
