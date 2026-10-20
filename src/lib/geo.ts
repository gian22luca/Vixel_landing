import caba from "@/data/caba.json";

const { bounds, k, sx } = caba;

/** Proyecta [lat, lng] al viewBox del mapa de CABA. */
export function project([lat, lng]: [number, number]): [number, number] {
  return [(lng - bounds.lonMin) * k * sx, (bounds.latMax - lat) * sx];
}

/** Catmull-Rom → Bézier para trazar recorridos suaves. */
export function smoothPath(pts: [number, number][]) {
  const p = pts.map(project);
  if (p.length < 2) return "";
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const t = 0.5 / 3;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export const MAP = caba;
