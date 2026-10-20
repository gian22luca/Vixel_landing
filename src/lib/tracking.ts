// Cálculos del seguimiento de recorrido (portados del panel original).

export type LatLon = [number, number];

export const TERMINAL_RADIUS_M = 100;
export const DEVIATION_THRESHOLD_M = 100;
export const DEVIATION_DEBOUNCE = 3;

export const COLOR_IDA = "#ff4d4d";
export const COLOR_VUELTA = "#4d8bff";

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlam = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceToRoute(lat: number, lon: number, route: LatLon[]) {
  let min = Infinity;
  for (const p of route) {
    const d = haversine(lat, lon, p[0], p[1]);
    if (d < min) min = d;
  }
  return min;
}

export function isNear(lat: number, lon: number, t: LatLon) {
  return haversine(lat, lon, t[0], t[1]) <= TERMINAL_RADIUS_M;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export function fmtFecha(iso?: string | null) {
  if (!iso) return "--";
  return new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Carga Leaflet solo en el navegador (usa window al importarse). */
export async function loadLeaflet() {
  const mod = await import("leaflet");
  return ("default" in mod ? mod.default : mod) as typeof import("leaflet");
}

export function dotIcon(L: typeof import("leaflet"), color: string, size: number, border = 3) {
  return L.divIcon({
    className: "bo-marker",
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:${border}px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
