"use client";

// Configuración remota del dispositivo. Habla contra el backend propio con el
// JWT del login; solo el rol "admin" puede guardar (lo hace cumplir el backend).

import { useCallback, useEffect, useState } from "react";
import { apiFetch, errorMessage } from "@/lib/auth";
import { usePerfil } from "@/components/backoffice/Shell";

type Dispositivo = { id: number; nombre: string };
type Config = {
  volumen: number;
  texto_default: string;
  radio_deteccion_parada_m: number;
  intervalo_subida_s: number;
};
type Alerta = { tipo: "info" | "ok" | "error"; msg: string } | null;

export default function ConfigPage() {
  const perfil = usePerfil();
  const esAdmin = perfil?.rol === "admin";
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [seleccionado, setSeleccionado] = useState<string>("");
  const [config, setConfig] = useState<Config | null>(null);
  const [alerta, setAlerta] = useState<Alerta>({ tipo: "info", msg: "Cargando..." });
  const [guardando, setGuardando] = useState(false);

  const cargarConfiguracion = useCallback(async (id: string) => {
    setConfig(null);
    setAlerta({ tipo: "info", msg: "Cargando configuración..." });
    const resp = await apiFetch(`/api/dispositivos/${id}/configuracion/`);
    if (!resp.ok) {
      setAlerta({ tipo: "error", msg: `No se pudo leer la configuración (${resp.status}).` });
      return;
    }
    setConfig(await resp.json());
    setAlerta(null);
  }, []);

  useEffect(() => {
    (async () => {
      const resp = await apiFetch("/api/dispositivos/");
      if (!resp.ok) {
        setAlerta({ tipo: "error", msg: `No se pudieron cargar los dispositivos (${resp.status}).` });
        return;
      }
      const lista: Dispositivo[] = await resp.json();
      setDispositivos(lista);
      if (lista.length === 0) {
        setAlerta({ tipo: "error", msg: "No hay dispositivos cargados todavía. Un admin puede crear uno desde /admin/." });
        return;
      }
      setSeleccionado(String(lista[0].id));
      cargarConfiguracion(String(lista[0].id));
    })();
  }, [cargarConfiguracion]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setGuardando(true);
    try {
      const resp = await apiFetch(`/api/dispositivos/${seleccionado}/configuracion/`, {
        method: "PATCH",
        body: JSON.stringify({ ...config, texto_default: config.texto_default || "LINEA 102 - VIXEL" }),
      });
      if (!resp.ok) throw new Error(await errorMessage(resp));
      setAlerta({ tipo: "ok", msg: "Dispositivo actualizado. Toma los cambios en menos de 60 segundos." });
    } catch (err) {
      setAlerta({ tipo: "error", msg: "No se pudo guardar: " + (err instanceof Error ? err.message : String(err)) });
    } finally {
      setGuardando(false);
    }
  }

  const set = <K extends keyof Config>(k: K, v: Config[K]) => setConfig((c) => (c ? { ...c, [k]: v } : c));

  return (
    <main className="mx-auto flex max-w-[640px] flex-col gap-5 px-4 py-8 md:py-12">
      <section className="bo-card">
        <h2>Dispositivo</h2>
        <p className="bo-sub">Elegí la unidad a configurar.</p>
        <div className="bo-field">
          <label htmlFor="dispositivo">Unidad</label>
          <select
            id="dispositivo"
            className="bo-input"
            value={seleccionado}
            onChange={(e) => {
              setSeleccionado(e.target.value);
              cargarConfiguracion(e.target.value);
            }}
          >
            {dispositivos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="bo-card">
        <h2>Parámetros del dispositivo</h2>
        <p className="bo-sub">Los cambios se aplican en el dispositivo en menos de 60 segundos.</p>

        {alerta && <div className={`bo-alert ${alerta.tipo} mb-4`}>{alerta.msg}</div>}

        {config && (
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="bo-field">
              <label htmlFor="volumen">Volumen del audio (0-30)</label>
              <div className="flex items-center gap-3">
                <input
                  id="volumen"
                  type="range"
                  min={0}
                  max={30}
                  className="bo-range"
                  value={config.volumen}
                  onChange={(e) => set("volumen", parseInt(e.target.value, 10))}
                />
                <span className="min-w-[2ch] text-right font-mono text-cyan">{config.volumen}</span>
              </div>
            </div>
            <div className="bo-field">
              <label htmlFor="texto">Texto por defecto en pantalla</label>
              <input
                id="texto"
                className="bo-input"
                maxLength={64}
                placeholder="LINEA 102 - VIXEL"
                value={config.texto_default}
                onChange={(e) => set("texto_default", e.target.value)}
              />
            </div>
            <div className="bo-field">
              <label htmlFor="radio">Radio de detección de parada (metros)</label>
              <input
                id="radio"
                type="number"
                min={5}
                max={200}
                className="bo-input"
                value={config.radio_deteccion_parada_m}
                onChange={(e) => set("radio_deteccion_parada_m", parseInt(e.target.value, 10))}
              />
            </div>
            <div className="bo-field">
              <label htmlFor="intervalo">Intervalo de subida de datos (segundos)</label>
              <input
                id="intervalo"
                type="number"
                min={15}
                max={600}
                className="bo-input"
                value={config.intervalo_subida_s}
                onChange={(e) => set("intervalo_subida_s", parseInt(e.target.value, 10))}
              />
            </div>
            <button
              type="submit"
              className="bo-btn bo-btn-primary self-start"
              disabled={guardando || !esAdmin}
              title={esAdmin ? undefined : "Solo un usuario admin puede guardar cambios."}
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
