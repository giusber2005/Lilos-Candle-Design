// Italian CAP (postal code) first-2-digits → { region, lat, lon }
// Used to geolocate orders from shipping address postal codes
const CAP_MAP: Record<number, { region: string; lat: number; lon: number }> = {
  0:  { region: "Lazio",                  lat: 41.900, lon: 12.492 },
  1:  { region: "Lazio",                  lat: 42.417, lon: 12.107 },
  2:  { region: "Lazio",                  lat: 42.404, lon: 12.856 },
  3:  { region: "Lazio",                  lat: 41.640, lon: 13.349 },
  4:  { region: "Lazio",                  lat: 41.467, lon: 12.900 },
  5:  { region: "Umbria",                 lat: 42.563, lon: 12.643 },
  6:  { region: "Umbria",                 lat: 43.108, lon: 12.389 },
  7:  { region: "Sardegna",               lat: 40.727, lon:  8.557 },
  8:  { region: "Sardegna",               lat: 40.320, lon:  9.330 },
  9:  { region: "Sardegna",               lat: 39.216, lon:  9.118 },
  10: { region: "Piemonte",               lat: 45.071, lon:  7.687 },
  11: { region: "Valle d'Aosta",          lat: 45.737, lon:  7.321 },
  12: { region: "Piemonte",               lat: 44.384, lon:  7.542 },
  13: { region: "Piemonte",               lat: 45.520, lon:  8.086 },
  14: { region: "Piemonte",               lat: 44.899, lon:  8.207 },
  15: { region: "Piemonte",               lat: 44.914, lon:  8.615 },
  16: { region: "Liguria",                lat: 44.407, lon:  8.934 },
  17: { region: "Liguria",                lat: 44.307, lon:  8.481 },
  18: { region: "Liguria",                lat: 43.885, lon:  7.966 },
  19: { region: "Liguria",                lat: 44.102, lon:  9.824 },
  20: { region: "Lombardia",              lat: 45.467, lon:  9.190 },
  21: { region: "Lombardia",              lat: 45.820, lon:  8.826 },
  22: { region: "Lombardia",              lat: 45.810, lon:  9.086 },
  23: { region: "Lombardia",              lat: 46.171, lon:  9.887 },
  24: { region: "Lombardia",              lat: 45.693, lon:  9.670 },
  25: { region: "Lombardia",              lat: 45.541, lon: 10.211 },
  26: { region: "Lombardia",              lat: 45.133, lon:  9.896 },
  27: { region: "Lombardia",              lat: 45.184, lon:  9.157 },
  28: { region: "Piemonte",               lat: 45.446, lon:  8.623 },
  29: { region: "Emilia-Romagna",         lat: 45.052, lon:  9.693 },
  30: { region: "Veneto",                 lat: 45.437, lon: 12.335 },
  31: { region: "Veneto",                 lat: 45.667, lon: 12.242 },
  32: { region: "Veneto",                 lat: 46.141, lon: 12.217 },
  33: { region: "Friuli-Venezia Giulia",  lat: 46.065, lon: 13.237 },
  34: { region: "Friuli-Venezia Giulia",  lat: 45.651, lon: 13.781 },
  35: { region: "Veneto",                 lat: 45.407, lon: 11.878 },
  36: { region: "Veneto",                 lat: 45.547, lon: 11.546 },
  37: { region: "Veneto",                 lat: 45.437, lon: 10.993 },
  38: { region: "Trentino-Alto Adige",    lat: 46.069, lon: 11.119 },
  39: { region: "Trentino-Alto Adige",    lat: 46.500, lon: 11.357 },
  40: { region: "Emilia-Romagna",         lat: 44.494, lon: 11.342 },
  41: { region: "Emilia-Romagna",         lat: 44.647, lon: 10.925 },
  42: { region: "Emilia-Romagna",         lat: 44.697, lon: 10.629 },
  43: { region: "Emilia-Romagna",         lat: 44.801, lon: 10.328 },
  44: { region: "Emilia-Romagna",         lat: 44.838, lon: 11.620 },
  45: { region: "Veneto",                 lat: 45.070, lon: 11.788 },
  46: { region: "Lombardia",              lat: 45.157, lon: 10.791 },
  47: { region: "Emilia-Romagna",         lat: 44.221, lon: 12.041 },
  48: { region: "Emilia-Romagna",         lat: 44.418, lon: 12.199 },
  49: { region: "Emilia-Romagna",         lat: 44.200, lon: 10.900 },
  50: { region: "Toscana",               lat: 43.770, lon: 11.257 },
  51: { region: "Toscana",               lat: 43.932, lon: 10.917 },
  52: { region: "Toscana",               lat: 43.465, lon: 11.879 },
  53: { region: "Toscana",               lat: 43.318, lon: 11.331 },
  54: { region: "Toscana",               lat: 44.035, lon: 10.142 },
  55: { region: "Toscana",               lat: 43.844, lon: 10.502 },
  56: { region: "Toscana",               lat: 43.723, lon: 10.396 },
  57: { region: "Toscana",               lat: 43.547, lon: 10.310 },
  58: { region: "Toscana",               lat: 42.760, lon: 11.114 },
  59: { region: "Toscana",               lat: 43.882, lon: 11.095 },
  60: { region: "Marche",                lat: 43.617, lon: 13.519 },
  61: { region: "Marche",                lat: 43.911, lon: 12.914 },
  62: { region: "Marche",                lat: 43.298, lon: 13.453 },
  63: { region: "Marche",                lat: 42.856, lon: 13.575 },
  64: { region: "Abruzzo",               lat: 42.659, lon: 13.703 },
  65: { region: "Abruzzo",               lat: 42.461, lon: 14.215 },
  66: { region: "Abruzzo",               lat: 42.352, lon: 14.168 },
  67: { region: "Abruzzo",               lat: 42.352, lon: 13.400 },
  68: { region: "Molise",                lat: 41.562, lon: 14.664 },
  69: { region: "Molise",                lat: 41.602, lon: 14.230 },
  70: { region: "Puglia",                lat: 41.126, lon: 16.867 },
  71: { region: "Puglia",                lat: 41.460, lon: 15.560 },
  72: { region: "Puglia",                lat: 40.638, lon: 17.942 },
  73: { region: "Puglia",                lat: 40.352, lon: 18.172 },
  74: { region: "Puglia",                lat: 40.476, lon: 17.231 },
  75: { region: "Basilicata",            lat: 40.665, lon: 16.604 },
  76: { region: "Puglia",                lat: 41.312, lon: 16.285 },
  77: { region: "Campania",              lat: 40.836, lon: 14.253 },
  78: { region: "Campania",              lat: 40.836, lon: 14.253 },
  79: { region: "Campania",              lat: 40.836, lon: 14.253 },
  80: { region: "Campania",              lat: 40.836, lon: 14.253 },
  81: { region: "Campania",              lat: 41.067, lon: 14.330 },
  82: { region: "Campania",              lat: 41.130, lon: 14.783 },
  83: { region: "Campania",              lat: 40.915, lon: 15.124 },
  84: { region: "Campania",              lat: 40.680, lon: 14.759 },
  85: { region: "Basilicata",            lat: 40.640, lon: 15.805 },
  86: { region: "Molise",                lat: 41.562, lon: 14.664 },
  87: { region: "Calabria",              lat: 39.298, lon: 16.256 },
  88: { region: "Calabria",              lat: 38.906, lon: 16.594 },
  89: { region: "Calabria",              lat: 38.114, lon: 15.650 },
  90: { region: "Sicilia",               lat: 38.115, lon: 13.362 },
  91: { region: "Sicilia",               lat: 37.869, lon: 12.537 },
  92: { region: "Sicilia",               lat: 37.322, lon: 13.584 },
  93: { region: "Sicilia",               lat: 37.490, lon: 14.062 },
  94: { region: "Sicilia",               lat: 37.567, lon: 14.277 },
  95: { region: "Sicilia",               lat: 37.502, lon: 15.088 },
  96: { region: "Sicilia",               lat: 37.075, lon: 15.287 },
  97: { region: "Sicilia",               lat: 36.930, lon: 14.731 },
  98: { region: "Sicilia",               lat: 38.193, lon: 15.553 },
  99: { region: "Sicilia",               lat: 37.600, lon: 14.015 },
};

export interface OrderGeoPoint {
  lat: number;
  lon: number;
  region: string;
  label: string;
}

export function geocodeOrder(address: {
  postalCode?: string;
  city?: string;
  country?: string;
}): OrderGeoPoint | null {
  const { postalCode, city, country } = address;
  // Only map Italian addresses
  if (country && !["IT", "Italia", "Italy", "ITA"].includes(country)) return null;

  if (postalCode && /^\d{5}$/.test(postalCode.trim())) {
    const prefix = parseInt(postalCode.trim().substring(0, 2), 10);
    const geo = CAP_MAP[prefix];
    if (geo) {
      return { lat: geo.lat, lon: geo.lon, region: geo.region, label: city || postalCode };
    }
  }

  // Fallback: Italy centroid
  if (!country || ["IT", "Italia", "Italy", "ITA"].includes(country)) {
    return { lat: 41.902, lon: 12.496, region: "Sconosciuta", label: city || "—" };
  }

  return null;
}

export function geometricMedian(points: [number, number][]): [number, number] {
  if (points.length === 0) return [41.902, 12.496];
  if (points.length === 1) return points[0];

  // Start from centroid
  let [x, y] = points.reduce(([sx, sy], [px, py]) => [sx + px, sy + py], [0, 0]);
  x /= points.length;
  y /= points.length;

  // Weiszfeld algorithm
  for (let iter = 0; iter < 60; iter++) {
    let wx = 0, wy = 0, wsum = 0;
    for (const [px, py] of points) {
      const d = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (d < 1e-10) continue;
      const w = 1 / d;
      wx += px * w;
      wy += py * w;
      wsum += w;
    }
    if (wsum < 1e-10) break;
    x = wx / wsum;
    y = wy / wsum;
  }
  return [x, y];
}

export function buildRegionStats(points: OrderGeoPoint[]): Array<{ region: string; count: number; pct: number }> {
  const counts: Record<string, number> = {};
  for (const p of points) {
    counts[p.region] = (counts[p.region] ?? 0) + 1;
  }
  const total = points.length || 1;
  return Object.entries(counts)
    .map(([region, count]) => ({ region, count, pct: Math.round((count / total) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count);
}
