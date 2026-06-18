import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminAuth, adminFetch } from "@/lib/admin-auth";
import { Eye, Users, TrendingUp, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface Analytics {
  kpis: {
    visitsToday: number;
    visits7d: number;
    visits30d: number;
    sessions7d: number;
  };
  timeseries: { date: string; visits: number }[];
  topPages: { path: string; visits: number; pct: number }[];
  devices: { type: string; count: number; pct: number }[];
  referrers: { referrer: string | null; count: number }[];
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: "#2C2826",
  mobile: "#7C6B8A",
  tablet: "#C5BEB8",
  other: "#8B8680",
};

const PAGE_COLOR = "#7C6B8A";

function KpiCard({ label, value, icon: Icon, sub }: { label: string; value: number; icon: React.ElementType; sub?: string }) {
  return (
    <div className="bg-white border border-[#E8E3DC] p-6 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">{label}</p>
        <Icon size={16} className="text-[#C5BEB8]" />
      </div>
      <p className="font-serif text-3xl text-[#2C2826]">{value.toLocaleString("it-IT")}</p>
      {sub && <p className="text-xs text-[#8B8680]">{sub}</p>}
    </div>
  );
}

function formatDateLabel(date: string): string {
  const [, , day] = date.split("-");
  return day;
}

export default function AnalyticsPage() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/api/analytics", token)
      .then((r) => r.json())
      .then((d: Analytics) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#2C2826] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <p className="text-sm text-[#8B8680]">Errore nel caricamento dei dati.</p>
      </AdminLayout>
    );
  }

  const hasData = data.kpis.visits30d > 0;

  return (
    <AdminLayout>
      <h1 className="font-serif text-3xl text-[#2C2826] mb-2">Analitiche</h1>
      <p className="text-sm text-[#8B8680] mb-8">
        Visite registrate dal sito pubblico. Aggiornate in tempo reale.
      </p>

      {!hasData && (
        <div className="bg-[#F0EBE3] border border-[#E8E3DC] p-6 mb-8 text-sm text-[#8B8680]">
          Nessuna visita registrata ancora. I dati appariranno non appena qualcuno visita il sito.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Oggi" value={data.kpis.visitsToday} icon={Eye} sub="visite nelle ultime 24h" />
        <KpiCard label="Ultimi 7 giorni" value={data.kpis.visits7d} icon={TrendingUp} sub="visite" />
        <KpiCard label="Ultimi 30 giorni" value={data.kpis.visits30d} icon={Calendar} sub="visite" />
        <KpiCard label="Sessioni (7gg)" value={data.kpis.sessions7d} icon={Users} sub="utenti distinti" />
      </div>

      {data.timeseries.length > 0 && (
        <div className="bg-white border border-[#E8E3DC] p-6 mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-6">Visite giornaliere — ultimi 30 giorni</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.timeseries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 11, fill: "#8B8680" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8B8680" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={28}
              />
              <Tooltip
                contentStyle={{ border: "1px solid #E8E3DC", borderRadius: 0, fontSize: 12 }}
                labelFormatter={(l) => `Data: ${l}`}
                formatter={(v: number) => [v, "Visite"]}
              />
              <Line
                type="monotone"
                dataKey="visits"
                stroke="#7C6B8A"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "#7C6B8A" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {data.topPages.length > 0 && (
          <div className="bg-white border border-[#E8E3DC] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-6">Pagine più visitate</p>
            <ResponsiveContainer width="100%" height={data.topPages.length * 36 + 16}>
              <BarChart
                layout="vertical"
                data={data.topPages}
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 11, fill: "#8B8680" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="path"
                  tick={{ fontSize: 11, fill: "#2C2826" }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <Tooltip
                  contentStyle={{ border: "1px solid #E8E3DC", borderRadius: 0, fontSize: 12 }}
                  formatter={(v: number, _: string, entry: any) => [
                    `${v} visite (${entry.payload.pct}%)`,
                    "Visite",
                  ]}
                />
                <Bar dataKey="visits" radius={0}>
                  {data.topPages.map((_, i) => (
                    <Cell key={i} fill={PAGE_COLOR} fillOpacity={1 - i * 0.07} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.devices.length > 0 && (
          <div className="bg-white border border-[#E8E3DC] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-6">Dispositivi</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.devices}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  innerRadius={40}
                  paddingAngle={2}
                  label={({ type, pct }) => `${type} ${pct}%`}
                  labelLine={false}
                >
                  {data.devices.map((d, i) => (
                    <Cell key={i} fill={DEVICE_COLORS[d.type] ?? "#C5BEB8"} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span style={{ fontSize: 12, color: "#2C2826" }}>{value}</span>}
                />
                <Tooltip
                  contentStyle={{ border: "1px solid #E8E3DC", borderRadius: 0, fontSize: 12 }}
                  formatter={(v: number, name: string, entry: any) => [
                    `${v} (${entry.payload.pct}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {data.referrers.length > 0 && (
        <div className="bg-white border border-[#E8E3DC] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-4">Sorgenti di traffico (referrer)</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E3DC]">
                <th className="text-left text-xs text-[#8B8680] font-normal pb-2">Provenienza</th>
                <th className="text-right text-xs text-[#8B8680] font-normal pb-2">Visite</th>
              </tr>
            </thead>
            <tbody>
              {data.referrers.map((r, i) => (
                <tr key={i} className="border-b border-[#F0EBE3] last:border-0">
                  <td className="py-2 text-[#2C2826] font-mono text-xs">{r.referrer || "—"}</td>
                  <td className="py-2 text-right text-[#2C2826]">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
