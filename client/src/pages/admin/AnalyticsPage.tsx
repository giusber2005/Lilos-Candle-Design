import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useAdminAuth, adminFetch } from "@/lib/admin-auth";
import { Eye, Users, TrendingUp, Calendar, Monitor, Smartphone, Tablet, HelpCircle } from "lucide-react";
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

// Muted brand hues; separation validated for color-blind readers. Every device
// is also named + iconed, so identity never relies on color alone.
const DEVICES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  desktop: { label: "Desktop", color: "#6E5A8C", icon: Monitor },
  mobile: { label: "Smartphone", color: "#C0874A", icon: Smartphone },
  tablet: { label: "Tablet", color: "#4F8A7A", icon: Tablet },
  other: { label: "Altro", color: "#8B8680", icon: HelpCircle },
};
const DEVICE_ORDER = ["desktop", "mobile", "tablet", "other"];

function DeviceBreakdown({ devices }: { devices: Analytics["devices"] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  // merge any unknown types into "other" and keep a fixed order so colors never shift
  const merged = new Map<string, number>();
  for (const d of devices) {
    const key = DEVICES[d.type] ? d.type : "other";
    merged.set(key, (merged.get(key) ?? 0) + d.count);
  }
  const total = [...merged.values()].reduce((a, b) => a + b, 0);
  const rows = DEVICE_ORDER.filter((k) => merged.has(k)).map((k) => ({
    key: k,
    ...DEVICES[k],
    count: merged.get(k)!,
    pct: total > 0 ? (merged.get(k)! / total) * 100 : 0,
  }));
  const top = [...rows].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="bg-white border border-[#E8E3DC] rounded-2xl p-6 flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">Dispositivi</p>
        <p className="text-xs text-[#8B8680]">{total.toLocaleString("it-IT")} visite totali</p>
      </div>

      {top && (
        <div className="mb-5">
          <p className="font-serif text-4xl text-[#2C2826] leading-none">
            {top.pct.toFixed(0)}<span className="text-xl text-[#8B8680]">%</span>
          </p>
          <p className="text-sm text-[#8B8680] mt-1">delle visite da {top.label.toLowerCase()}</p>
        </div>
      )}

      {/* 100% stacked bar */}
      <div className="flex h-3 w-full gap-[2px] mb-6" role="img" aria-label="Ripartizione visite per dispositivo">
        {rows.map((r) => (
          <div
            key={r.key}
            onMouseEnter={() => setHovered(r.key)}
            onMouseLeave={() => setHovered(null)}
            title={`${r.label}: ${r.count} visite (${r.pct.toFixed(1)}%)`}
            className="h-full first:rounded-l-full last:rounded-r-full transition-opacity duration-200"
            style={{
              width: `${r.pct}%`,
              minWidth: r.count > 0 ? 6 : 0,
              backgroundColor: r.color,
              opacity: hovered && hovered !== r.key ? 0.35 : 1,
            }}
          />
        ))}
      </div>

      <ul className="space-y-3">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <li
              key={r.key}
              onMouseEnter={() => setHovered(r.key)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 -mx-3 transition-colors ${hovered === r.key ? "bg-[#FAF8F5]" : ""}`}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${r.color}1F` }}
              >
                <Icon size={15} style={{ color: r.color }} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-[#2C2826]">{r.label}</span>
                  <span className="text-sm text-[#2C2826] tabular-nums">
                    {r.pct.toFixed(1)}%
                    <span className="text-xs text-[#8B8680] ml-2">{r.count.toLocaleString("it-IT")}</span>
                  </span>
                </div>
                <div className="h-1 bg-[#F0EBE3] rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const PAGE_COLOR = "#7C6B8A";

function KpiCard({ label, value, icon: Icon, sub }: { label: string; value: number; icon: React.ElementType; sub?: string }) {
  return (
    <div className="bg-white border border-[#E8E3DC] p-6 flex flex-col gap-2 rounded-2xl">
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
        <div className="bg-[#F0EBE3] border border-[#E8E3DC] p-6 mb-8 text-sm text-[#8B8680] rounded-2xl">
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
        <div className="bg-white border border-[#E8E3DC] p-6 mb-6 rounded-2xl">
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
          <div className="bg-white border border-[#E8E3DC] p-6 rounded-2xl">
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
                <Bar dataKey="visits" radius={[0, 4, 4, 0]}>
                  {data.topPages.map((_, i) => (
                    <Cell key={i} fill={PAGE_COLOR} fillOpacity={1 - i * 0.07} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.devices.length > 0 && <DeviceBreakdown devices={data.devices} />}
      </div>

      {data.referrers.length > 0 && (
        <div className="bg-white border border-[#E8E3DC] p-6 rounded-2xl">
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
