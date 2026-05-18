import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { geocodeOrder, geometricMedian, buildRegionStats, type OrderGeoPoint } from "@/lib/italian-geo";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell } from "recharts";

interface Order {
  shippingAddress: any;
  orderNumber: string;
}

interface Props {
  orders: Order[];
}

interface LocationGroup {
  lat: number;
  lon: number;
  region: string;
  label: string;
  orderNumbers: string[];
}

function FlyToCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center[0], center[1]]);
  return null;
}

const BAR_COLORS = [
  "#7C6B8A", "#8B8680", "#9B8EA0", "#6B5E78", "#A89AB5",
  "#5C4E6A", "#BCB0C8", "#4C3E58", "#CCC3D5", "#3C2E48",
];

export default function OrdersGeoSection({ orders }: Props) {
  const { groups, allPoints, center, regionStats } = useMemo(() => {
    const pts: (OrderGeoPoint & { orderNumber: string })[] = [];
    for (const o of orders) {
      const addr = o.shippingAddress;
      if (!addr) continue;
      const pt = geocodeOrder({
        postalCode: addr.postalCode,
        city: addr.city,
        country: addr.country,
      });
      if (pt) pts.push({ ...pt, orderNumber: o.orderNumber });
    }

    // Group orders that share the same geocoded position (same CAP prefix → same lat/lon)
    const groupMap: Record<string, LocationGroup> = {};
    for (const p of pts) {
      const key = `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`;
      if (!groupMap[key]) {
        groupMap[key] = { lat: p.lat, lon: p.lon, region: p.region, label: p.label, orderNumbers: [] };
      }
      groupMap[key].orderNumbers.push(p.orderNumber);
    }

    const latLons: [number, number][] = pts.map((p) => [p.lat, p.lon]);
    const med = geometricMedian(latLons);
    const stats = buildRegionStats(pts);

    return {
      groups: Object.values(groupMap),
      allPoints: pts,
      center: med as [number, number],
      regionStats: stats,
    };
  }, [orders]);

  if (orders.length === 0) return null;

  const mappableCount = allPoints.length;

  return (
    <div className="mb-8 space-y-4 isolate">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-[0.2em] text-[#8B8680]">Provenienza ordini</h2>
        <span className="text-xs text-[#C5BEB8]">
          {mappableCount} ordini localizzati su {orders.length}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Map */}
        <div className="bg-white border border-[#E8E3DC] overflow-hidden" style={{ height: 420 }}>
          {mappableCount === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-[#8B8680]">
              Nessun ordine localizzabile
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={6}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
              />
              <FlyToCenter center={center} />

              {/* Geometric median — rendered first so order dots appear above it */}
              <CircleMarker
                center={center}
                radius={10}
                pathOptions={{ color: "#2C2826", fillColor: "#2C2826", fillOpacity: 0.85, weight: 2 }}
              >
                <Tooltip permanent direction="top" offset={[0, -12]}>
                  <span style={{ fontSize: 11 }}>Centro ordini</span>
                </Tooltip>
              </CircleMarker>

              {/* One marker per unique location; radius scales with order count */}
              {groups.map((g, i) => (
                <CircleMarker
                  key={i}
                  center={[g.lat, g.lon]}
                  radius={7 + Math.min((g.orderNumbers.length - 1) * 3, 9)}
                  pathOptions={{
                    color: "#5C4A79",
                    fillColor: "#7C6B8A",
                    fillOpacity: 0.82,
                    weight: 1.5,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]}>
                    <div style={{ fontSize: 11, lineHeight: 1.55 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        {g.label} — {g.region}
                        {g.orderNumbers.length > 1 && (
                          <span style={{ fontWeight: 400, color: "#8B8680" }}>
                            {" "}({g.orderNumbers.length} ordini)
                          </span>
                        )}
                      </div>
                      {g.orderNumbers.map((n) => (
                        <div key={n} style={{ color: "#5C4E6A" }}>#{n}</div>
                      ))}
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Region histogram */}
        <div className="bg-white border border-[#E8E3DC] p-5 flex flex-col">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8B8680] mb-4">Distribuzione per regione</p>
          {regionStats.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[#8B8680]">
              Nessun dato
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height={Math.max(300, regionStats.length * 28)}>
                <BarChart
                  data={regionStats}
                  layout="vertical"
                  margin={{ top: 0, right: 48, bottom: 0, left: 8 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: "#8B8680" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="region"
                    width={150}
                    tick={{ fontSize: 12, fill: "#2C2826" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RTooltip
                    formatter={(val: number, _name: string, props: any) => [
                      `${val}% (${props.payload.count} ordini)`,
                      "Quota",
                    ]}
                    contentStyle={{ fontSize: 12, border: "1px solid #E8E3DC", borderRadius: 0 }}
                  />
                  <Bar dataKey="pct" radius={0} label={{ position: "right", fontSize: 11, fill: "#8B8680", formatter: (v: number) => `${v}%` }}>
                    {regionStats.map((_, idx) => (
                      <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
