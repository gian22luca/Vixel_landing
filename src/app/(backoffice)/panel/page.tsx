"use client";

// Panel de seguimiento en tiempo real. La posición GPS se sigue leyendo directo
// de ThingSpeak desde el navegador (igual que el panel original); el recorrido
// sale de /api/lineas/ y el historial de viajes queda en localStorage.

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { Circle, Map as LMap, Marker, Polyline } from "leaflet";
import { apiFetch } from "@/lib/auth";
import { RUTA_IDA, RUTA_VUELTA, TERMINAL1, TERMINAL2 } from "@/data/rutaRespaldo";
import {
  COLOR_IDA,
  COLOR_VUELTA,
  DEVIATION_DEBOUNCE,
  DEVIATION_THRESHOLD_M,
  distanceToRoute,
  dotIcon,
  formatBytes,
  formatDuration,
  formatTime,
  haversine,
  isNear,
  loadLeaflet,
  type LatLon,
} from "@/lib/tracking";

// Para agregar un dispositivo: crear canal en ThingSpeak y sumar una línea acá.
const DEVICES = [
  { id: "bus1", name: "Interno 1", channel: "3264955", color: "#2ee6f5" },
  // { id: "bus2", name: "Interno 2", channel: "TU_CHANNEL_ID", color: "#3cffc8" },
];

type Dir = "ida" | "vuelta";
type Meter = { sent: number; recv: number; reqs: number; uptime: number };
type DevState = {
  enabled: boolean;
  position: LatLon | null;
  tripState: "waiting" | "in_progress" | "completed";
  tripDirection: Dir | null;
  tripStartTime: Date | null;
  tripEndTime: Date | null;
  deviations: { time: Date; distance: number }[];
  offRouteCount: number;
  currentlyOffRoute: boolean;
  tripPositions: LatLon[];
  tripTotalDist: number;
  countIda: number;
  countVuelta: number;
  distToRoute: number | null;
  lastUpdate: { time: string; lat: number; lon: number; acc: number } | null;
  meter: Meter | null;
};
type Trip = {
  id: number;
  deviceName: string;
  deviceColor: string;
  direction: Dir;
  startTime: string;
  endTime: string;
  elapsedMs: number;
  avgSpeedKmh: number;
  distanceKm: number;
  deviationCount: number;
};

const LS_KEY = "gps_trip_history";
const MAX_HISTORY = 500;
const DATA_BAR_MAX_BYTES = 10 * 1024 * 1024;

function newState(): DevState {
  return {
    enabled: true, position: null,
    tripState: "waiting", tripDirection: null, tripStartTime: null, tripEndTime: null,
    deviations: [], offRouteCount: 0, currentlyOffRoute: false,
    tripPositions: [], tripTotalDist: 0, countIda: 0, countVuelta: 0,
    distToRoute: null, lastUpdate: null, meter: null,
  };
}

function resetTrip(d: DevState) {
  d.tripState = "waiting";
  d.tripDirection = null;
  d.tripStartTime = null;
  d.tripEndTime = null;
  d.deviations = [];
  d.offRouteCount = 0;
  d.currentlyOffRoute = false;
  d.tripPositions = [];
  d.tripTotalDist = 0;
  d.distToRoute = null;
}

function snapshot(all: Record<string, DevState>) {
  return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, { ...v, deviations: [...v.deviations] }]));
}

function loadHistory(): Trip[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveTrip(deviceId: string, d: DevState) {
  if (!d.tripStartTime || !d.tripEndTime || !d.tripDirection) return;
  const dev = DEVICES.find((x) => x.id === deviceId);
  const elapsedMs = d.tripEndTime.getTime() - d.tripStartTime.getTime();
  const distKm = d.tripTotalDist / 1000;
  const h = elapsedMs / 3600000;
  const trip: Trip = {
    id: Date.now(),
    deviceName: dev?.name ?? deviceId,
    deviceColor: dev?.color ?? "#999",
    direction: d.tripDirection,
    startTime: d.tripStartTime.toISOString(),
    endTime: d.tripEndTime.toISOString(),
    elapsedMs,
    avgSpeedKmh: h > 0 && distKm > 0 ? parseFloat((distKm / h).toFixed(1)) : 0,
    distanceKm: parseFloat(distKm.toFixed(2)),
    deviationCount: d.deviations.length,
  };
  try {
    const history = loadHistory();
    history.unshift(trip);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    localStorage.setItem(LS_KEY, JSON.stringify(history));
  } catch {
    /* sin storage disponible: el viaje no queda en el historial */
  }
}

export default function PanelPage() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const markers = useRef<Record<string, { marker: Marker; circle: Circle }>>({});
  const routeLayers = useRef<{ ida: Polyline | null; vuelta: Polyline | null }>({ ida: null, vuelta: null });
  const ds = useRef<Record<string, DevState>>(Object.fromEntries(DEVICES.map((d) => [d.id, newState()])));

  const [snap, setSnap] = useState(() => snapshot(Object.fromEntries(DEVICES.map((d) => [d.id, newState()]))));
  const [focused, setFocused] = useState(DEVICES[0].id);
  const [showIda, setShowIda] = useState(true);
  const [showVuelta, setShowVuelta] = useState(true);
  const [now, setNow] = useState(0);
  const visible = useRef({ ida: true, vuelta: true });
  const [historial, setHistorial] = useState<Trip[] | null>(null);

  const publish = () => setSnap(snapshot(ds.current));

  // Mapa, recorrido y polling de ThingSpeak.
  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setInterval>[] = [];
    const route = { t1: TERMINAL1, t2: TERMINAL2, ida: RUTA_IDA, vuelta: RUTA_VUELTA };
    const states = ds.current;
    const markerMap = markers.current;
    const layers = routeLayers.current;

    (async () => {
      const L = await loadLeaflet();
      if (cancelled || !mapEl.current) return;
      const map = L.map(mapEl.current).setView([-34.6037, -58.3816], 13);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      let terminalMarkers: Marker[] = [];
      const drawRoute = () => {
        layers.ida?.remove();
        layers.vuelta?.remove();
        terminalMarkers.forEach((m) => m.remove());
        layers.ida = L.polyline(route.ida, { color: COLOR_IDA, weight: 3, opacity: 0.85 }).bindPopup("Recorrido IDA");
        layers.vuelta = L.polyline(route.vuelta, { color: COLOR_VUELTA, weight: 3, opacity: 0.85 }).bindPopup("Recorrido VUELTA");
        terminalMarkers = [
          L.marker(route.t1, { icon: dotIcon(L, "#2ecc71", 18) }).bindPopup("<b>Terminal 1</b><br>Inicio del recorrido"),
          L.marker(route.t2, { icon: dotIcon(L, "#b03030", 18) }).bindPopup("<b>Terminal 2</b><br>Fin del recorrido"),
        ];
        terminalMarkers.forEach((m) => m.addTo(map));
        if (visible.current.ida) layers.ida.addTo(map);
        if (visible.current.vuelta) layers.vuelta.addTo(map);
      };
      drawRoute();

      // Pisa el recorrido con la Línea activa cargada desde /gestion, si hay.
      apiFetch("/api/lineas/")
        .then((r) => (r.ok ? r.json() : []))
        .then((lineas) => {
          const linea = lineas.find((l: { activa: boolean }) => l.activa) || lineas[0];
          if (cancelled || !linea || linea.terminal1_lat == null || linea.terminal2_lat == null) return;
          route.t1 = [linea.terminal1_lat, linea.terminal1_lon];
          route.t2 = [linea.terminal2_lat, linea.terminal2_lon];
          if (linea.ruta_ida?.length > 1) route.ida = linea.ruta_ida;
          if (linea.ruta_vuelta?.length > 1) route.vuelta = linea.ruta_vuelta;
          drawRoute();
        })
        .catch(() => {});

      const processTrip = (lat: number, lon: number, d: DevState, deviceId: string) => {
        const t = new Date();
        if (d.tripState === "waiting") {
          const dir: Dir | null = isNear(lat, lon, route.t1) ? "vuelta" : isNear(lat, lon, route.t2) ? "ida" : null;
          if (dir) {
            resetTrip(d);
            d.tripState = "in_progress";
            d.tripDirection = dir;
            d.tripStartTime = t;
            d.tripPositions = [[lat, lon]];
          }
        } else if (d.tripState === "in_progress") {
          const activeRoute = d.tripDirection === "vuelta" ? route.vuelta : route.ida;
          const destino = d.tripDirection === "vuelta" ? route.t2 : route.t1;
          const last = d.tripPositions[d.tripPositions.length - 1];
          const step = haversine(last[0], last[1], lat, lon);
          if (step < 500) d.tripTotalDist += step;
          d.tripPositions.push([lat, lon]);

          const dist = distanceToRoute(lat, lon, activeRoute);
          d.distToRoute = dist;
          if (dist > DEVIATION_THRESHOLD_M) {
            d.offRouteCount++;
            if (d.offRouteCount === DEVIATION_DEBOUNCE && !d.currentlyOffRoute) {
              d.currentlyOffRoute = true;
              d.deviations.push({ time: t, distance: Math.round(dist) });
            }
          } else {
            d.offRouteCount = 0;
            d.currentlyOffRoute = false;
          }

          if (isNear(lat, lon, destino)) {
            d.tripState = "completed";
            d.tripEndTime = t;
            if (d.tripDirection === "vuelta") d.countVuelta++;
            else d.countIda++;
            saveTrip(deviceId, d);
          }
        } else if (d.tripState === "completed") {
          const llegada = d.tripDirection === "vuelta" ? route.t2 : route.t1;
          if (!isNear(lat, lon, llegada)) {
            d.tripState = "waiting";
            d.tripDirection = null;
            d.distToRoute = null;
          }
        }
      };

      let first = true;
      const updateLocation = async (dev: (typeof DEVICES)[number]) => {
        const d = states[dev.id];
        if (!d.enabled) return;
        try {
          const data = await fetch(`https://api.thingspeak.com/channels/${dev.channel}/feeds/last.json`).then((r) => r.json());
          if (cancelled || data.field1 == null || !d.enabled) return;
          const lat = parseFloat(data.field1);
          const lon = parseFloat(data.field2);
          const acc = (data.field3 ? parseFloat(data.field3) : 5.0) * 10;

          const m = markerMap[dev.id];
          if (m) {
            m.marker.setLatLng([lat, lon]);
            m.circle.setLatLng([lat, lon]).setRadius(acc);
          } else {
            markerMap[dev.id] = {
              marker: L.marker([lat, lon], { icon: dotIcon(L, dev.color, 14, 2) }).addTo(map).bindPopup(`<b>${dev.name}</b>`),
              circle: L.circle([lat, lon], { color: dev.color, fillColor: dev.color, fillOpacity: 0.1, radius: acc }).addTo(map),
            };
            if (first) map.setView([lat, lon], 15);
            first = false;
          }

          d.position = [lat, lon];
          d.lastUpdate = { time: data.created_at, lat, lon, acc };
          if (data.field4 != null) {
            d.meter = {
              sent: parseInt(data.field4),
              recv: parseInt(data.field5),
              reqs: parseInt(data.field6),
              uptime: parseInt(data.field7),
            };
          }
          processTrip(lat, lon, d, dev.id);
          setSnap(snapshot(states));
        } catch (err) {
          console.error(`[${dev.name}] Error:`, err);
        }
      };

      DEVICES.forEach((dev) => {
        updateLocation(dev);
        timers.push(setInterval(() => updateLocation(dev), 5000));
      });
    })();

    timers.push(setInterval(() => setNow(Date.now()), 1000));

    return () => {
      cancelled = true;
      timers.forEach(clearInterval);
      mapRef.current?.remove();
      mapRef.current = null;
      Object.keys(markerMap).forEach((k) => delete markerMap[k]);
      layers.ida = layers.vuelta = null;
    };
  }, []);

  useEffect(() => {
    visible.current = { ida: showIda, vuelta: showVuelta };
    const map = mapRef.current;
    const { ida, vuelta } = routeLayers.current;
    if (!map) return;
    if (ida) {
      if (showIda) ida.addTo(map);
      else ida.remove();
    }
    if (vuelta) {
      if (showVuelta) vuelta.addTo(map);
      else vuelta.remove();
    }
  }, [showIda, showVuelta]);

  function onDeviceClick(id: string) {
    const d = ds.current[id];
    if (!d.enabled) {
      d.enabled = true;
      setFocused(id);
    } else if (id !== focused) {
      setFocused(id);
    } else {
      const otros = DEVICES.filter((x) => ds.current[x.id].enabled && x.id !== id);
      if (otros.length === 0) return;
      d.enabled = false;
      const m = markers.current[id];
      if (m) {
        m.marker.remove();
        m.circle.remove();
        delete markers.current[id];
      }
      setFocused(otros[0].id);
    }
    publish();
  }

  function onReset() {
    resetTrip(ds.current[focused]);
    publish();
  }

  function onCenter() {
    const pos = snap[focused].position;
    if (pos) mapRef.current?.setView(pos, 15);
  }

  const d = snap[focused];
  const dev = DEVICES.find((x) => x.id === focused)!;

  let elapsedMs = 0;
  if (d.tripState === "in_progress" && d.tripStartTime) elapsedMs = Math.max(0, now - d.tripStartTime.getTime());
  else if (d.tripState === "completed" && d.tripStartTime && d.tripEndTime)
    elapsedMs = d.tripEndTime.getTime() - d.tripStartTime.getTime();
  const distKm = d.tripTotalDist / 1000;
  const hasSpeed = elapsedMs > 0 && distKm > 0;

  const badge =
    d.tripState === "waiting"
      ? { text: "Esperando salida", color: "var(--ink-mute)" }
      : d.tripState === "in_progress"
        ? d.tripDirection === "vuelta"
          ? { text: "VUELTA en curso (T1 → T2)", color: COLOR_VUELTA }
          : { text: "IDA en curso (T2 → T1)", color: COLOR_IDA }
        : { text: `${d.tripDirection === "vuelta" ? "VUELTA" : "IDA"} completada`, color: "var(--mint)" };

  const meter = d.meter;
  const total = meter ? meter.sent + meter.recv : 0;

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 md:px-6">
      {DEVICES.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {DEVICES.map((x) => {
            const s = snap[x.id];
            return (
              <button
                key={x.id}
                onClick={() => onDeviceClick(x.id)}
                className={clsx("bo-btn bo-btn-ghost bo-btn-sm", x.id === focused && "!shadow-[inset_0_0_0_1px_var(--cyan)]", !s.enabled && "opacity-50")}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.enabled ? x.color : "#666" }} />
                {x.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="bo-map relative h-[58vh] min-h-[340px] lg:h-[640px]">
            <div ref={mapEl} className="h-full w-full" />
            <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-[calc(100%-5rem)] rounded-xl bg-[rgba(35,35,35,0.88)] px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-[inset_0_0_0_1px_var(--hair-2)] backdrop-blur">
              {d.lastUpdate ? (
                <>
                  <b className="font-medium">{dev.name} · Última actualización</b>
                  <div className="font-mono text-[11.5px] text-ink-dim">
                    {d.lastUpdate.time}
                    <br />
                    {d.lastUpdate.lat}, {d.lastUpdate.lon}
                    <br />± {d.lastUpdate.acc.toFixed(1)} m
                  </div>
                </>
              ) : (
                <span className="text-ink-dim">Esperando datos...</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="bo-btn bo-btn-ghost bo-btn-sm cursor-pointer">
              <input type="checkbox" className="bo-check" checked={showIda} onChange={(e) => setShowIda(e.target.checked)} />
              <span className="h-2 w-2 rounded-full" style={{ background: COLOR_IDA }} /> IDA
            </label>
            <label className="bo-btn bo-btn-ghost bo-btn-sm cursor-pointer">
              <input type="checkbox" className="bo-check" checked={showVuelta} onChange={(e) => setShowVuelta(e.target.checked)} />
              <span className="h-2 w-2 rounded-full" style={{ background: COLOR_VUELTA }} /> VUELTA
            </label>
            <button className="bo-btn bo-btn-ghost bo-btn-sm" onClick={onCenter} disabled={!d.position}>
              Centrar GPS
            </button>
          </div>

          <section className="bo-card">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <span className="bo-label">SIM808 · Datos reales</span>
              {meter && <span className="font-mono text-[11px] text-ink-mute">de 10 MB</span>}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 xl:grid-cols-6">
              {[
                ["Enviado", meter ? formatBytes(meter.sent) : "--"],
                ["Recibido", meter ? formatBytes(meter.recv) : "--"],
                ["Total", meter ? formatBytes(total) : "--"],
                ["Envíos", meter ? String(meter.reqs) : "--"],
                ["Tasa", meter && meter.uptime > 0 ? (total / 1024 / (meter.uptime / 3600)).toFixed(1) + " KB/h" : "--"],
                ["Uptime dispositivo", meter ? formatDuration(meter.uptime * 1000) : "--:--:--"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <span className="text-[12px] text-ink-mute">{k}</span>
                  <span className="font-mono text-[15px]">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full bg-cyan transition-[width] duration-700" style={{ width: `${Math.min((total / DATA_BAR_MAX_BYTES) * 100, 100)}%` }} />
            </div>
          </section>
        </div>

        <aside className="bo-card flex flex-col gap-4 self-start">
          <h2>Estadísticas · {dev.name}</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "IDA", sub: "T2 → T1", n: d.countIda, color: COLOR_IDA },
              { label: "VUELTA", sub: "T1 → T2", n: d.countVuelta, color: COLOR_VUELTA },
            ].map((c) => (
              <div key={c.label} className="rounded-xl bg-bg p-3.5 shadow-[inset_0_0_0_1px_var(--hair)]">
                <div className="flex items-center gap-2 text-[12px] text-ink-dim">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </div>
                <div className="mt-1 font-display text-[2rem] font-medium leading-none">{c.n}</div>
                <div className="mt-1 font-mono text-[11px] text-ink-mute">{c.sub}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 rounded-full px-4 py-2 text-[13.5px] shadow-[inset_0_0_0_1px_var(--hair-2)]">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: badge.color }} />
            {badge.text}
          </div>

          <dl className="flex flex-col text-[14px]">
            {[
              ["Salida", d.tripStartTime ? formatTime(d.tripStartTime) : "--:--:--"],
              ["Llegada", d.tripEndTime ? formatTime(d.tripEndTime) : "--:--:--"],
              ["Tiempo", formatDuration(elapsedMs)],
              ["Vel. media", hasSpeed ? (distKm / (elapsedMs / 3600000)).toFixed(1) + " km/h" : "-- km/h"],
              ["Distancia", hasSpeed ? distKm.toFixed(2) + " km" : "-- km"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-hair py-2 last:border-0">
                <dt className="text-ink-dim">{k}</dt>
                <dd className="font-mono">{v}</dd>
              </div>
            ))}
          </dl>

          <div
            className={clsx(
              "rounded-xl p-4 text-center shadow-[inset_0_0_0_1px_var(--hair)]",
              d.distToRoute != null && d.distToRoute > DEVIATION_THRESHOLD_M && "!shadow-[inset_0_0_0_1px_rgba(255,110,110,0.6)]",
            )}
          >
            <div className="text-[12px] text-ink-dim">
              {d.distToRoute == null ? "Distancia a ruta" : d.tripDirection === "ida" ? "Distancia a ruta roja" : "Distancia a ruta azul"}
            </div>
            <div
              className={clsx(
                "mt-1 font-display text-[2.2rem] font-medium leading-none",
                d.distToRoute != null && d.distToRoute > DEVIATION_THRESHOLD_M && "text-[#ff8a8a]",
              )}
            >
              {d.distToRoute == null ? "--" : Math.round(d.distToRoute)}
            </div>
            <div className="mt-1 font-mono text-[11px] text-ink-mute">metros</div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[14px] text-ink-dim">Desvíos</span>
              <span className={clsx("font-mono text-[15px]", d.deviations.length ? "text-[#ff8a8a]" : "text-mint")}>
                {d.deviations.length}
              </span>
            </div>
            {d.deviations.length === 0 ? (
              <p className="text-[13px] text-ink-mute">Sin desvíos registrados</p>
            ) : (
              <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                {d.deviations.map((x, i) => (
                  <li key={i} className="rounded-lg bg-bg px-3 py-2 text-[13px]">
                    <span className="font-mono text-ink-dim">{formatTime(x.time)}</span> · {x.distance} m fuera de ruta
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {d.tripState !== "waiting" && (
              <button className={clsx("bo-btn bo-btn-sm", d.tripState === "completed" ? "bo-btn-primary" : "bo-btn-ghost")} onClick={onReset}>
                Reiniciar
              </button>
            )}
            <button className="bo-btn bo-btn-ghost bo-btn-sm" onClick={() => setHistorial(loadHistory())}>
              Ver historial
            </button>
          </div>
        </aside>
      </div>

      {historial && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={(e) => e.target === e.currentTarget && setHistorial(null)}
        >
          <div className="bo-card flex max-h-[88dvh] w-full max-w-[1000px] flex-col !rounded-b-none sm:!rounded-[1.25rem]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2>Historial de viajes</h2>
              <button className="bo-btn bo-btn-ghost bo-btn-sm" onClick={() => setHistorial(null)} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {historial.length === 0 ? (
                <p className="py-8 text-center text-ink-mute">No hay viajes registrados aún.</p>
              ) : (
                <table className="bo-table">
                  <thead>
                    <tr>
                      <th>Fecha</th><th>Horario</th><th>Unidad</th><th>Dirección</th><th>Duración</th><th>Vel. media</th><th>Distancia</th><th>Desvíos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((t) => {
                      const s = new Date(t.startTime);
                      const e = new Date(t.endTime);
                      const hm = (x: Date) => x.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
                      return (
                        <tr key={t.id}>
                          <td data-label="Fecha">{s.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}</td>
                          <td data-label="Horario" className="num">{hm(s)} – {hm(e)}</td>
                          <td data-label="Unidad">{t.deviceName}</td>
                          <td data-label="Dirección">
                            <span style={{ color: t.direction === "ida" ? COLOR_IDA : COLOR_VUELTA }}>{t.direction === "ida" ? "IDA" : "VUELTA"}</span>
                          </td>
                          <td data-label="Duración" className="num">{formatDuration(t.elapsedMs)}</td>
                          <td data-label="Vel. media">{t.avgSpeedKmh > 0 ? t.avgSpeedKmh + " km/h" : "--"}</td>
                          <td data-label="Distancia">{t.distanceKm > 0 ? t.distanceKm + " km" : "--"}</td>
                          <td data-label="Desvíos" className={t.deviationCount > 0 ? "text-[#ff8a8a]" : "text-mint"}>{t.deviationCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="bo-btn bo-btn-ghost bo-btn-sm bo-btn-danger"
                onClick={() => {
                  if (!confirm("¿Borrar todo el historial de viajes? Esta acción no se puede deshacer.")) return;
                  try {
                    localStorage.removeItem(LS_KEY);
                  } catch {}
                  setHistorial([]);
                }}
              >
                Limpiar historial
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
