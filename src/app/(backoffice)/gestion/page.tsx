"use client";

// Gestión: ABM de Líneas (dibujadas sobre el mapa) y Paradas, más vistas de
// solo lectura de Posiciones y Viajes. Leer está abierto a cualquier rol
// logueado; escribir requiere rol admin (lo hace cumplir el backend).

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { Map as LMap, Layer } from "leaflet";
import { apiFetch, errorMessage } from "@/lib/auth";
import { usePerfil } from "@/components/backoffice/Shell";
import { COLOR_IDA, COLOR_VUELTA, dotIcon, fmtFecha, loadLeaflet, type LatLon } from "@/lib/tracking";

type Alerta = { tipo: "ok" | "error"; msg: string } | null;
type Punto = { lat: number; lon: number };

type Linea = {
  id: number;
  nombre: string;
  terminal1_nombre: string;
  terminal1_lat: number | null;
  terminal1_lon: number | null;
  terminal2_nombre: string;
  terminal2_lat: number | null;
  terminal2_lon: number | null;
  ruta_ida: LatLon[];
  ruta_vuelta: LatLon[];
  activa: boolean;
};
type Parada = {
  id: number;
  orden: number;
  nombre: string;
  lat: number;
  lon: number;
  texto_pantalla: string;
  audio_track: string;
};
type Posicion = { id: number; dispositivo: number; dispositivo_nombre?: string; timestamp: string; lat: number; lon: number; hdop: number | null };
type Viaje = {
  id: number;
  dispositivo: number;
  dispositivo_nombre?: string;
  direccion: "ida" | "vuelta";
  inicio: string;
  fin: string | null;
  distancia_km: number | null;
  velocidad_media_kmh: number | null;
};

const msg = (err: unknown) => (err instanceof Error ? err.message : String(err));

// ==================== GEOCODING (Nominatim / OSM) ====================
// Solo se llama cuando el usuario aprieta "Ubicar"/"Buscar", con countrycodes=ar.
async function geocode(query: string): Promise<Punto> {
  const url = "https://nominatim.openstreetmap.org/search?format=json&countrycodes=ar&limit=1&q=" + encodeURIComponent(query);
  const resp = await fetch(url, { headers: { Accept: "application/json" } });
  if (!resp.ok) throw new Error(`Error al consultar el geocodificador (${resp.status})`);
  const results = await resp.json();
  if (!results.length) throw new Error("No se encontró esa dirección.");
  return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
}

function GeocodeButton({
  query,
  onResult,
  onError,
  label,
}: {
  query: string;
  onResult: (p: Punto) => void;
  onError: (m: string) => void;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="bo-btn bo-btn-ghost"
      disabled={busy}
      onClick={async () => {
        if (!query.trim()) return onError("Escribí una dirección primero.");
        setBusy(true);
        try {
          onResult(await geocode(query.trim()));
        } catch (err) {
          onError("No se pudo ubicar: " + msg(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Buscando..." : label}
    </button>
  );
}

// ==================== IMPORTAR KML ====================
// Busca Placemark en cualquier nivel (Google My Maps los anida en Folders).
// Point → terminal, LineString → ruta ida/vuelta, en el orden del archivo.
// No soporta KMZ (KML comprimido).
function parseKML(xmlText: string) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("El archivo no es un KML válido.");
  const points: (Punto & { nombre: string })[] = [];
  const lines: LatLon[][] = [];
  doc.querySelectorAll("Placemark").forEach((pm) => {
    const nombre = pm.querySelector("name")?.textContent?.trim() ?? "";
    const point = pm.querySelector("Point > coordinates");
    if (point) {
      const pp = point.textContent!.trim().split(",");
      points.push({ lat: parseFloat(pp[1]), lon: parseFloat(pp[0]), nombre });
    }
    const line = pm.querySelector("LineString > coordinates");
    if (line) {
      lines.push(
        line.textContent!.trim().split(/\s+/).map((par) => {
          const pp = par.split(",");
          return [parseFloat(pp[1]), parseFloat(pp[0])] as LatLon;
        }),
      );
    }
  });
  return { points, lines };
}

// ==================== LÍNEAS ====================
type Modo = "terminal1" | "terminal2" | "ida" | "vuelta" | null;
type Trazado = { terminal1: Punto | null; terminal2: Punto | null; rutaIda: LatLon[]; rutaVuelta: LatLon[] };

const TRAZADO_VACIO: Trazado = { terminal1: null, terminal2: null, rutaIda: [], rutaVuelta: [] };
const LINEA_VACIA = { id: "", nombre: "", t1: "", t2: "", activa: true, dirT1: "", dirT2: "" };

const HINTS: Record<Exclude<Modo, null>, string> = {
  terminal1: "Click en el mapa para ubicar la Terminal 1.",
  terminal2: "Click en el mapa para ubicar la Terminal 2.",
  ida: "Click en el mapa para ir agregando puntos del recorrido de IDA, en orden.",
  vuelta: "Click en el mapa para ir agregando puntos del recorrido de VUELTA, en orden.",
};

function aplicarClick(t: Trazado, modo: Modo, lat: number, lon: number): Trazado {
  if (modo === "terminal1") return { ...t, terminal1: { lat, lon } };
  if (modo === "terminal2") return { ...t, terminal2: { lat, lon } };
  if (modo === "ida") return { ...t, rutaIda: [...t.rutaIda, [lat, lon]] };
  if (modo === "vuelta") return { ...t, rutaVuelta: [...t.rutaVuelta, [lat, lon]] };
  return t;
}

function boundsDe(t: Trazado): LatLon[] {
  const b: LatLon[] = [];
  if (t.terminal1) b.push([t.terminal1.lat, t.terminal1.lon]);
  if (t.terminal2) b.push([t.terminal2.lat, t.terminal2.lon]);
  return b.concat(t.rutaIda, t.rutaVuelta);
}

function LineasSection({ esAdmin }: { esAdmin: boolean }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const capas = useRef<Layer[]>([]);
  const modoRef = useRef<Modo>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [lineas, setLineas] = useState<Linea[] | null>(null);
  const [cargaError, setCargaError] = useState<string | null>(null);
  const [form, setForm] = useState(LINEA_VACIA);
  const [trazado, setTrazado] = useState<Trazado>(TRAZADO_VACIO);
  const [modo, setModo] = useState<Modo>(null);
  const [alerta, setAlerta] = useState<Alerta>(null);
  const [guardando, setGuardando] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Subir "version" vuelve a pedir la lista (después de guardar o borrar).
  const [version, setVersion] = useState(0);
  const cargar = () => setVersion((v) => v + 1);

  useEffect(() => {
    let off = false;
    apiFetch("/api/lineas/")
      .then(async (resp) => {
        if (!resp.ok) throw new Error(`No se pudo cargar (${resp.status})`);
        const data = await resp.json();
        if (off) return;
        setCargaError(null);
        setLineas(data);
      })
      .catch((err) => !off && setCargaError(msg(err)));
    return () => {
      off = true;
    };
  }, [version]);

  // doubleClickZoom off: dos clicks seguidos para marcar dos puntos cercanos
  // del recorrido se interpretaban como zoom y se perdía uno.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await loadLeaflet();
      if (cancelled || !mapEl.current) return;
      leaflet.current = L;
      const map = L.map(mapEl.current, { doubleClickZoom: false }).setView([-34.6037, -58.3816], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      map.on("click", (e) => setTrazado((t) => aplicarClick(t, modoRef.current, e.latlng.lat, e.latlng.lng)));
      mapRef.current = map;
      setMapReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Redibuja terminales y recorridos cada vez que cambia el trazado.
  useEffect(() => {
    const map = mapRef.current;
    const L = leaflet.current;
    if (!map || !L || !mapReady) return;
    capas.current.forEach((c) => c.remove());
    capas.current = [];
    // Un click sobre un marker no llega al click del mapa (Leaflet corta la
    // propagación); sin esto, marcar un punto de ruta justo sobre una terminal
    // (algo normal: la ruta arranca y termina ahí) se perdía en silencio.
    const terminal = (p: Punto, color: string, label: string) =>
      L.marker([p.lat, p.lon], { icon: dotIcon(L, color, 18) })
        .bindPopup(label)
        .on("click", () => setTrazado((t) => aplicarClick(t, modoRef.current, p.lat, p.lon)));
    if (trazado.terminal1) capas.current.push(terminal(trazado.terminal1, "#2ecc71", "Terminal 1"));
    if (trazado.terminal2) capas.current.push(terminal(trazado.terminal2, "#b03030", "Terminal 2"));
    if (trazado.rutaIda.length > 1) capas.current.push(L.polyline(trazado.rutaIda, { color: COLOR_IDA, weight: 3, opacity: 0.85 }));
    if (trazado.rutaVuelta.length > 1) capas.current.push(L.polyline(trazado.rutaVuelta, { color: COLOR_VUELTA, weight: 3, opacity: 0.85 }));
    capas.current.forEach((c) => c.addTo(map));
  }, [trazado, mapReady]);

  function encuadrar(t: Trazado) {
    const b = boundsDe(t);
    if (b.length) mapRef.current?.fitBounds(b, { padding: [20, 20] });
  }

  function elegirModo(m: Exclude<Modo, null>) {
    const nuevo = modo === m ? null : m;
    modoRef.current = nuevo;
    setModo(nuevo);
  }

  function deshacer(limpiar: boolean) {
    if (modo !== "ida" && modo !== "vuelta") {
      setAlerta({ tipo: "error", msg: `Elegí "Dibujar recorrido IDA/VUELTA" para ${limpiar ? "limpiarlo" : "deshacer un punto"}.` });
      return;
    }
    const k = modo === "ida" ? "rutaIda" : "rutaVuelta";
    setTrazado((t) => ({ ...t, [k]: limpiar ? [] : t[k].slice(0, -1) }));
  }

  function limpiarForm() {
    setForm(LINEA_VACIA);
    setTrazado(TRAZADO_VACIO);
    modoRef.current = null;
    setModo(null);
  }

  function editar(l: Linea) {
    setForm({ ...LINEA_VACIA, id: String(l.id), nombre: l.nombre, t1: l.terminal1_nombre, t2: l.terminal2_nombre, activa: l.activa });
    const t: Trazado = {
      terminal1: l.terminal1_lat != null && l.terminal1_lon != null ? { lat: l.terminal1_lat, lon: l.terminal1_lon } : null,
      terminal2: l.terminal2_lat != null && l.terminal2_lon != null ? { lat: l.terminal2_lat, lon: l.terminal2_lon } : null,
      rutaIda: [...(l.ruta_ida || [])],
      rutaVuelta: [...(l.ruta_vuelta || [])],
    };
    setTrazado(t);
    encuadrar(t);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function borrar(id: number) {
    if (!confirm("¿Borrar esta línea? No se puede deshacer.")) return;
    const resp = await apiFetch(`/api/lineas/${id}/`, { method: "DELETE" });
    if (resp.ok) {
      setAlerta({ tipo: "ok", msg: "Línea borrada." });
      cargar();
    } else setAlerta({ tipo: "error", msg: `No se pudo borrar (${resp.status})` });
  }

  async function importarKML(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { points, lines } = parseKML(await file.text());
      if (points.length === 0 && lines.length === 0) throw new Error("No se encontraron puntos ni líneas en el archivo.");
      const t: Trazado = {
        terminal1: points[0] ? { lat: points[0].lat, lon: points[0].lon } : trazado.terminal1,
        terminal2: points[1] ? { lat: points[1].lat, lon: points[1].lon } : trazado.terminal2,
        rutaIda: lines[0] ?? trazado.rutaIda,
        rutaVuelta: lines[1] ?? trazado.rutaVuelta,
      };
      setForm((f) => ({ ...f, t1: points[0]?.nombre || f.t1, t2: points[1]?.nombre || f.t2 }));
      setTrazado(t);
      encuadrar(t);
      setAlerta({ tipo: "ok", msg: `KML importado: ${points.length} punto(s), ${lines.length} línea(s). Revisá el mapa antes de guardar.` });
    } catch (err) {
      setAlerta({ tipo: "error", msg: "No se pudo importar el KML: " + msg(err) });
    } finally {
      e.target.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trazado.terminal1 || !trazado.terminal2) {
      setAlerta({ tipo: "error", msg: "Marcá la Terminal 1 y la Terminal 2 en el mapa antes de guardar." });
      return;
    }
    const payload = {
      nombre: form.nombre,
      terminal1_nombre: form.t1,
      terminal1_lat: trazado.terminal1.lat,
      terminal1_lon: trazado.terminal1.lon,
      terminal2_nombre: form.t2,
      terminal2_lat: trazado.terminal2.lat,
      terminal2_lon: trazado.terminal2.lon,
      ruta_ida: trazado.rutaIda,
      ruta_vuelta: trazado.rutaVuelta,
      activa: form.activa,
    };
    setGuardando(true);
    try {
      const resp = await apiFetch(form.id ? `/api/lineas/${form.id}/` : "/api/lineas/", {
        method: form.id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(await errorMessage(resp));
      setAlerta({ tipo: "ok", msg: form.id ? "Línea actualizada." : "Línea agregada." });
      limpiarForm();
      cargar();
    } catch (err) {
      setAlerta({ tipo: "error", msg: "No se pudo guardar: " + msg(err) });
    } finally {
      setGuardando(false);
    }
  }

  const setF = (patch: Partial<typeof LINEA_VACIA>) => setForm((f) => ({ ...f, ...patch }));
  const geoError = (m: string) => setAlerta({ tipo: "error", msg: m });
  const ubicarTerminal = (k: "terminal1" | "terminal2", p: Punto) => {
    setTrazado((t) => ({ ...t, [k]: p }));
    mapRef.current?.setView([p.lat, p.lon], 16);
  };

  return (
    <section className="bo-card">
      <h2>Líneas</h2>
      <p className="bo-sub">Terminales y recorrido (ida/vuelta) de cada línea. Se dibuja haciendo click en el mapa.</p>

      <form ref={formRef} onSubmit={onSubmit} className="scroll-mt-24">
        <div className="bo-row">
          <div className="bo-field md:!flex-[2]">
            <label htmlFor="linea-nombre">Nombre de la línea</label>
            <input id="linea-nombre" className="bo-input" maxLength={100} required value={form.nombre} onChange={(e) => setF({ nombre: e.target.value })} />
          </div>
          <div className="bo-field">
            <label htmlFor="linea-t1">Nombre Terminal 1</label>
            <input id="linea-t1" className="bo-input" maxLength={100} required value={form.t1} onChange={(e) => setF({ t1: e.target.value })} />
          </div>
          <div className="bo-field">
            <label htmlFor="linea-t2">Nombre Terminal 2</label>
            <input id="linea-t2" className="bo-input" maxLength={100} required value={form.t2} onChange={(e) => setF({ t2: e.target.value })} />
          </div>
          <label className="flex items-center gap-2.5 pb-3 text-[14px] text-ink-dim">
            <input type="checkbox" className="bo-check" checked={form.activa} onChange={(e) => setF({ activa: e.target.checked })} />
            Activa
          </label>
        </div>

        <div className="bo-row">
          <div className="bo-field md:!flex-[2]">
            <label htmlFor="linea-dir1">Terminal 1 por dirección (opcional)</label>
            <div className="flex gap-2">
              <input id="linea-dir1" className="bo-input" placeholder="Ej: Av. Rivadavia 5000, CABA" value={form.dirT1} onChange={(e) => setF({ dirT1: e.target.value })} />
              <GeocodeButton label="Ubicar" query={form.dirT1} onResult={(p) => ubicarTerminal("terminal1", p)} onError={geoError} />
            </div>
          </div>
          <div className="bo-field md:!flex-[2]">
            <label htmlFor="linea-dir2">Terminal 2 por dirección (opcional)</label>
            <div className="flex gap-2">
              <input id="linea-dir2" className="bo-input" placeholder="Ej: Av. Rivadavia 5000, CABA" value={form.dirT2} onChange={(e) => setF({ dirT2: e.target.value })} />
              <GeocodeButton label="Ubicar" query={form.dirT2} onResult={(p) => ubicarTerminal("terminal2", p)} onError={geoError} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["terminal1", "Marcar Terminal 1", "#2ecc71"],
              ["terminal2", "Marcar Terminal 2", "#b03030"],
              ["ida", "Dibujar recorrido IDA", COLOR_IDA],
              ["vuelta", "Dibujar recorrido VUELTA", COLOR_VUELTA],
            ] as const
          ).map(([m, label, color]) => (
            <button key={m} type="button" className={clsx("bo-btn bo-btn-ghost bo-btn-sm", modo === m && "is-active")} onClick={() => elegirModo(m)}>
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              {label}
            </button>
          ))}
          <button type="button" className="bo-btn bo-btn-ghost bo-btn-sm" onClick={() => deshacer(false)}>
            ↩ Deshacer último punto
          </button>
          <button type="button" className="bo-btn bo-btn-ghost bo-btn-sm" onClick={() => deshacer(true)}>
            Limpiar recorrido activo
          </button>
          <label className="bo-btn bo-btn-ghost bo-btn-sm cursor-pointer">
            Importar KML
            <input type="file" accept=".kml" hidden onChange={importarKML} />
          </label>
        </div>
        <p className="mt-3 text-[13.5px] text-ink">{modo ? HINTS[modo] : "Elegí qué marcar y hacé click en el mapa."}</p>
        <p className="mt-1 text-[12.5px] text-ink-mute">
          El KML debe traer puntos (Placemark + Point) para las terminales y líneas (Placemark + LineString) para el recorrido. Se importan
          como referencia y quedan igual de editables que si los hubieras dibujado a mano.
        </p>

        <div className="bo-map mt-4 h-[420px] md:h-[480px]">
          <div ref={mapEl} className={clsx("h-full w-full", modo && "[&_.leaflet-container]:cursor-crosshair")} />
        </div>
        <p className="mt-2 font-mono text-[11.5px] text-ink-mute">
          Puntos IDA: {trazado.rutaIda.length} · Puntos VUELTA: {trazado.rutaVuelta.length}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="bo-btn bo-btn-primary" disabled={!esAdmin || guardando}>
            {guardando ? "Guardando..." : form.id ? "Guardar cambios" : "Agregar línea"}
          </button>
          {form.id && (
            <button type="button" className="bo-btn bo-btn-ghost" onClick={limpiarForm}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {alerta && <div className={`bo-alert ${alerta.tipo} mt-4`}>{alerta.msg}</div>}

      <table className="bo-table mt-6">
        <thead>
          <tr>
            <th>Nombre</th><th>Terminal 1</th><th>Terminal 2</th><th>Puntos ida/vuelta</th><th>Activa</th><th />
          </tr>
        </thead>
        <tbody>
          {cargaError || !lineas || lineas.length === 0 ? (
            <tr>
              <td colSpan={6} className="bo-empty">{cargaError ?? (lineas ? "Sin líneas cargadas todavía." : "Cargando...")}</td>
            </tr>
          ) : (
            lineas.map((l) => (
              <tr key={l.id}>
                <td data-label="Nombre">{l.nombre}</td>
                <td data-label="Terminal 1">{l.terminal1_nombre}</td>
                <td data-label="Terminal 2">{l.terminal2_nombre}</td>
                <td data-label="Puntos" className="num">{l.ruta_ida.length} / {l.ruta_vuelta.length}</td>
                <td data-label="Activa">{l.activa ? "Sí" : "No"}</td>
                <td className="bo-actions">
                  {esAdmin && (
                    <>
                      <button className="bo-btn bo-btn-ghost bo-btn-sm" onClick={() => editar(l)}>Editar</button>{" "}
                      <button className="bo-btn bo-btn-ghost bo-btn-sm bo-btn-danger" onClick={() => borrar(l.id)}>Borrar</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

// ==================== PARADAS ====================
const PARADA_VACIA = { id: "", orden: "", nombre: "", lat: "", lon: "", texto: "", audio: "", direccion: "" };

function ParadasSection({ esAdmin }: { esAdmin: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [paradas, setParadas] = useState<Parada[] | null>(null);
  const [cargaError, setCargaError] = useState<string | null>(null);
  const [form, setForm] = useState(PARADA_VACIA);
  const [alerta, setAlerta] = useState<Alerta>(null);
  const [guardando, setGuardando] = useState(false);

  // Subir "version" vuelve a pedir la lista (después de guardar o borrar).
  const [version, setVersion] = useState(0);
  const cargar = () => setVersion((v) => v + 1);

  useEffect(() => {
    let off = false;
    apiFetch("/api/paradas/")
      .then(async (resp) => {
        if (!resp.ok) throw new Error(`No se pudo cargar (${resp.status})`);
        const data = await resp.json();
        if (off) return;
        setCargaError(null);
        setParadas(data);
      })
      .catch((err) => !off && setCargaError(msg(err)));
    return () => {
      off = true;
    };
  }, [version]);

  const setF = (patch: Partial<typeof PARADA_VACIA>) => setForm((f) => ({ ...f, ...patch }));

  function editar(p: Parada) {
    setForm({
      ...PARADA_VACIA,
      id: String(p.id),
      orden: String(p.orden),
      nombre: p.nombre,
      lat: String(p.lat),
      lon: String(p.lon),
      texto: p.texto_pantalla,
      audio: p.audio_track,
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function borrar(id: number) {
    if (!confirm("¿Borrar esta parada? No se puede deshacer.")) return;
    const resp = await apiFetch(`/api/paradas/${id}/`, { method: "DELETE" });
    if (resp.ok) {
      setAlerta({ tipo: "ok", msg: "Parada borrada." });
      cargar();
    } else setAlerta({ tipo: "error", msg: `No se pudo borrar (${resp.status})` });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      orden: parseInt(form.orden, 10),
      nombre: form.nombre,
      lat: parseFloat(form.lat),
      lon: parseFloat(form.lon),
      texto_pantalla: form.texto,
      audio_track: form.audio,
    };
    setGuardando(true);
    try {
      const resp = await apiFetch(form.id ? `/api/paradas/${form.id}/` : "/api/paradas/", {
        method: form.id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(await errorMessage(resp));
      setAlerta({ tipo: "ok", msg: form.id ? "Parada actualizada." : "Parada agregada." });
      setForm(PARADA_VACIA);
      cargar();
    } catch (err) {
      setAlerta({ tipo: "error", msg: "No se pudo guardar: " + msg(err) });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="bo-card">
      <h2>Paradas</h2>
      <p className="bo-sub">Recorrido de la Ramal A: nombre, orden, coordenadas, texto en pantalla y pista de audio.</p>

      <form ref={formRef} onSubmit={onSubmit} className="scroll-mt-24">
        <div className="bo-row">
          <div className="bo-field">
            <label htmlFor="parada-dir">Buscar por dirección (opcional)</label>
            <div className="flex gap-2">
              <input id="parada-dir" className="bo-input" placeholder="Ej: Av. Rivadavia 5000, CABA" value={form.direccion} onChange={(e) => setF({ direccion: e.target.value })} />
              <GeocodeButton
                label="Buscar"
                query={form.direccion}
                onResult={(p) => setF({ lat: p.lat.toFixed(6), lon: p.lon.toFixed(6) })}
                onError={(m) => setAlerta({ tipo: "error", msg: m })}
              />
            </div>
          </div>
        </div>
        <div className="bo-row">
          <div className="bo-field md:max-w-[120px]">
            <label htmlFor="parada-orden">Orden</label>
            <input id="parada-orden" type="number" min={1} className="bo-input" required value={form.orden} onChange={(e) => setF({ orden: e.target.value })} />
          </div>
          <div className="bo-field md:!flex-[2]">
            <label htmlFor="parada-nombre">Nombre</label>
            <input id="parada-nombre" className="bo-input" maxLength={100} required value={form.nombre} onChange={(e) => setF({ nombre: e.target.value })} />
          </div>
          <div className="bo-field">
            <label htmlFor="parada-lat">Latitud</label>
            <input id="parada-lat" inputMode="decimal" className="bo-input" required value={form.lat} onChange={(e) => setF({ lat: e.target.value })} />
          </div>
          <div className="bo-field">
            <label htmlFor="parada-lon">Longitud</label>
            <input id="parada-lon" inputMode="decimal" className="bo-input" required value={form.lon} onChange={(e) => setF({ lon: e.target.value })} />
          </div>
        </div>
        <div className="bo-row">
          <div className="bo-field md:!flex-[2]">
            <label htmlFor="parada-texto">Texto en pantalla</label>
            <input id="parada-texto" className="bo-input" maxLength={64} required value={form.texto} onChange={(e) => setF({ texto: e.target.value })} />
          </div>
          <div className="bo-field">
            <label htmlFor="parada-audio">Pista de audio</label>
            <input id="parada-audio" className="bo-input" placeholder="001.mp3" maxLength={10} required value={form.audio} onChange={(e) => setF({ audio: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bo-btn bo-btn-primary" disabled={!esAdmin || guardando}>
              {guardando ? "Guardando..." : form.id ? "Guardar cambios" : "Agregar"}
            </button>
            {form.id && (
              <button type="button" className="bo-btn bo-btn-ghost" onClick={() => setForm(PARADA_VACIA)}>
                Cancelar edición
              </button>
            )}
          </div>
        </div>
      </form>

      {alerta && <div className={`bo-alert ${alerta.tipo} mt-4`}>{alerta.msg}</div>}

      <table className="bo-table mt-6">
        <thead>
          <tr>
            <th>Orden</th><th>Nombre</th><th>Lat</th><th>Lon</th><th>Texto pantalla</th><th>Audio</th><th />
          </tr>
        </thead>
        <tbody>
          {cargaError || !paradas || paradas.length === 0 ? (
            <tr>
              <td colSpan={7} className="bo-empty">{cargaError ?? (paradas ? "Sin paradas cargadas todavía." : "Cargando...")}</td>
            </tr>
          ) : (
            paradas.map((p) => (
              <tr key={p.id}>
                <td data-label="Orden" className="num">{p.orden}</td>
                <td data-label="Nombre">{p.nombre}</td>
                <td data-label="Lat" className="num">{p.lat}</td>
                <td data-label="Lon" className="num">{p.lon}</td>
                <td data-label="Texto pantalla">{p.texto_pantalla}</td>
                <td data-label="Audio" className="num">{p.audio_track}</td>
                <td className="bo-actions">
                  {esAdmin && (
                    <>
                      <button className="bo-btn bo-btn-ghost bo-btn-sm" onClick={() => editar(p)}>Editar</button>{" "}
                      <button className="bo-btn bo-btn-ghost bo-btn-sm bo-btn-danger" onClick={() => borrar(p.id)}>Borrar</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

// ==================== POSICIONES / VIAJES (solo lectura) ====================
function useLista<T>(path: string) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    apiFetch(path)
      .then(async (resp) => {
        if (!resp.ok) return setError(`No se pudo cargar (${resp.status})`);
        setItems(((await resp.json()) as T[]).slice(0, 100));
      })
      .catch((err) => setError("No se pudo cargar: " + msg(err)));
  }, [path]);
  return { items, error };
}

function EmptyRow({ cols, error, items, vacio }: { cols: number; error: string | null; items: unknown[] | null; vacio: string }) {
  return (
    <tr>
      <td colSpan={cols} className="bo-empty">{error ?? (items ? vacio : "Cargando...")}</td>
    </tr>
  );
}

function PosicionesSection() {
  const { items, error } = useLista<Posicion>("/api/posiciones/");
  return (
    <section className="bo-card">
      <h2>Posiciones recientes</h2>
      <p className="bo-sub">Solo lectura: las carga el propio dispositivo, no se editan a mano.</p>
      <table className="bo-table">
        <thead>
          <tr>
            <th>Dispositivo</th><th>Fecha/hora</th><th>Lat</th><th>Lon</th><th>HDOP</th>
          </tr>
        </thead>
        <tbody>
          {error || !items || items.length === 0 ? (
            <EmptyRow cols={5} error={error} items={items} vacio="Sin posiciones registradas todavía." />
          ) : (
            items.map((p) => (
              <tr key={p.id ?? `${p.dispositivo}-${p.timestamp}`}>
                <td data-label="Dispositivo">{p.dispositivo_nombre || p.dispositivo}</td>
                <td data-label="Fecha/hora" className="num">{fmtFecha(p.timestamp)}</td>
                <td data-label="Lat" className="num">{p.lat}</td>
                <td data-label="Lon" className="num">{p.lon}</td>
                <td data-label="HDOP" className="num">{p.hdop ?? "--"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

function ViajesSection() {
  const { items, error } = useLista<Viaje>("/api/viajes/");
  return (
    <section className="bo-card">
      <h2>Viajes</h2>
      <p className="bo-sub">Solo lectura: historial calculado por el sistema.</p>
      <table className="bo-table">
        <thead>
          <tr>
            <th>Dispositivo</th><th>Dirección</th><th>Inicio</th><th>Fin</th><th>Distancia</th><th>Vel. media</th>
          </tr>
        </thead>
        <tbody>
          {error || !items || items.length === 0 ? (
            <EmptyRow cols={6} error={error} items={items} vacio="Sin viajes registrados todavía." />
          ) : (
            items.map((v) => (
              <tr key={v.id ?? `${v.dispositivo}-${v.inicio}`}>
                <td data-label="Dispositivo">{v.dispositivo_nombre || v.dispositivo}</td>
                <td data-label="Dirección">
                  <span style={{ color: v.direccion === "ida" ? COLOR_IDA : COLOR_VUELTA }}>{v.direccion === "ida" ? "IDA" : "VUELTA"}</span>
                </td>
                <td data-label="Inicio" className="num">{fmtFecha(v.inicio)}</td>
                <td data-label="Fin" className="num">{fmtFecha(v.fin)}</td>
                <td data-label="Distancia">{v.distancia_km ? v.distancia_km.toFixed(2) + " km" : "--"}</td>
                <td data-label="Vel. media">{v.velocidad_media_kmh ? v.velocidad_media_kmh.toFixed(1) + " km/h" : "--"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

export default function GestionPage() {
  const perfil = usePerfil();
  const esAdmin = perfil?.rol === "admin";
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 py-8 md:px-6 md:py-12">
      {perfil && !esAdmin && (
        <div className="bo-alert error">Estás en modo solo lectura: dar de alta o editar líneas y paradas requiere rol admin.</div>
      )}
      <LineasSection esAdmin={esAdmin} />
      <ParadasSection esAdmin={esAdmin} />
      <PosicionesSection />
      <ViajesSection />
    </main>
  );
}
