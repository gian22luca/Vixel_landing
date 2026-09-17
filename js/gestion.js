// Gestion: ABM de Paradas + vistas de solo lectura de Posiciones/Viajes.
// Leer estos tres recursos esta abierto a cualquier rol logueado (lo hace
// cumplir el backend), pero escribir Paradas requiere rol admin.

(function () {
  const token = VixelAuth.requireAuth();
  if (!token) return;

  document.getElementById("logout-btn").addEventListener("click", VixelAuth.logout);

  let esAdmin = false;

  VixelAuth.apiFetch("/api/auth/perfil/").then((r) => (r.ok ? r.json() : null)).then((perfil) => {
    if (!perfil) return;
    document.getElementById("app-user").textContent = perfil.username + " · " + perfil.rol;
    esAdmin = perfil.rol === "admin";
    if (!esAdmin) {
      document.getElementById("no-admin-alert").hidden = false;
      document.getElementById("no-admin-alert").textContent =
        "Estás en modo solo lectura — dar de alta o editar paradas requiere rol admin.";
      document.getElementById("parada-submit-btn").disabled = true;
    }
  }).catch(() => {});

  function fmtFecha(iso) {
    if (!iso) return "--";
    return new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  // ==================== PARADAS (ABM) ====================
  const paradaForm = document.getElementById("parada-form");
  const paradaAlert = document.getElementById("parada-alert");
  const paradaSubmitBtn = document.getElementById("parada-submit-btn");
  const paradaCancelBtn = document.getElementById("parada-cancel-btn");

  function setParadaAlert(tipo, msg) {
    paradaAlert.className = "app-alert " + tipo;
    paradaAlert.textContent = msg;
    paradaAlert.hidden = false;
  }

  function limpiarFormParada() {
    paradaForm.reset();
    document.getElementById("parada-id").value = "";
    paradaSubmitBtn.textContent = "Agregar";
    paradaCancelBtn.hidden = true;
  }

  async function cargarParadas() {
    const tbody = document.getElementById("paradas-tbody");
    const resp = await VixelAuth.apiFetch("/api/paradas/");
    if (!resp.ok) {
      tbody.innerHTML = '<tr><td colspan="7" class="gestion-empty">No se pudo cargar (' + resp.status + ")</td></tr>";
      return;
    }
    const paradas = await resp.json();
    if (paradas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="gestion-empty">Sin paradas cargadas todavía.</td></tr>';
      return;
    }
    tbody.innerHTML = paradas.map((p) => `
      <tr>
        <td>${p.orden}</td>
        <td>${p.nombre}</td>
        <td>${p.lat}</td>
        <td>${p.lon}</td>
        <td>${p.texto_pantalla}</td>
        <td>${p.audio_track}</td>
        <td>
          ${esAdmin ? `
            <button class="gestion-row-btn edit" data-id="${p.id}">Editar</button>
            <button class="gestion-row-btn delete" data-id="${p.id}">Borrar</button>
          ` : ""}
        </td>
      </tr>
    `).join("");

    tbody.querySelectorAll(".edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = paradas.find((x) => String(x.id) === btn.dataset.id);
        document.getElementById("parada-id").value = p.id;
        document.getElementById("parada-orden").value = p.orden;
        document.getElementById("parada-nombre").value = p.nombre;
        document.getElementById("parada-lat").value = p.lat;
        document.getElementById("parada-lon").value = p.lon;
        document.getElementById("parada-texto").value = p.texto_pantalla;
        document.getElementById("parada-audio").value = p.audio_track;
        paradaSubmitBtn.textContent = "Guardar cambios";
        paradaCancelBtn.hidden = false;
        paradaForm.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    tbody.querySelectorAll(".delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("¿Borrar esta parada? No se puede deshacer.")) return;
        const resp = await VixelAuth.apiFetch("/api/paradas/" + btn.dataset.id + "/", { method: "DELETE" });
        if (resp.ok || resp.status === 204) {
          setParadaAlert("ok", "Parada borrada.");
          cargarParadas();
        } else {
          setParadaAlert("error", "No se pudo borrar (" + resp.status + ")");
        }
      });
    });
  }

  paradaCancelBtn.addEventListener("click", limpiarFormParada);

  paradaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("parada-id").value;
    const payload = {
      orden: parseInt(document.getElementById("parada-orden").value, 10),
      nombre: document.getElementById("parada-nombre").value,
      lat: parseFloat(document.getElementById("parada-lat").value),
      lon: parseFloat(document.getElementById("parada-lon").value),
      texto_pantalla: document.getElementById("parada-texto").value,
      audio_track: document.getElementById("parada-audio").value,
    };

    paradaSubmitBtn.disabled = true;
    try {
      const url = id ? "/api/paradas/" + id + "/" : "/api/paradas/";
      const method = id ? "PATCH" : "POST";
      const resp = await VixelAuth.apiFetch(url, { method, body: JSON.stringify(payload) });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || JSON.stringify(err));
      }
      setParadaAlert("ok", id ? "Parada actualizada." : "Parada agregada.");
      limpiarFormParada();
      cargarParadas();
    } catch (err) {
      setParadaAlert("error", "No se pudo guardar: " + err.message);
    } finally {
      paradaSubmitBtn.disabled = !esAdmin ? true : false;
    }
  });

  // ==================== POSICIONES (solo lectura) ====================
  async function cargarPosiciones() {
    const tbody = document.getElementById("posiciones-tbody");
    const resp = await VixelAuth.apiFetch("/api/posiciones/");
    if (!resp.ok) {
      tbody.innerHTML = '<tr><td colspan="5" class="gestion-empty">No se pudo cargar (' + resp.status + ")</td></tr>";
      return;
    }
    const posiciones = await resp.json();
    if (posiciones.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="gestion-empty">Sin posiciones registradas todavía.</td></tr>';
      return;
    }
    tbody.innerHTML = posiciones.slice(0, 100).map((p) => `
      <tr>
        <td>${p.dispositivo_nombre || p.dispositivo}</td>
        <td>${fmtFecha(p.timestamp)}</td>
        <td>${p.lat}</td>
        <td>${p.lon}</td>
        <td>${p.hdop != null ? p.hdop : "--"}</td>
      </tr>
    `).join("");
  }

  // ==================== VIAJES (solo lectura) ====================
  async function cargarViajes() {
    const tbody = document.getElementById("viajes-tbody");
    const resp = await VixelAuth.apiFetch("/api/viajes/");
    if (!resp.ok) {
      tbody.innerHTML = '<tr><td colspan="6" class="gestion-empty">No se pudo cargar (' + resp.status + ")</td></tr>";
      return;
    }
    const viajes = await resp.json();
    if (viajes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="gestion-empty">Sin viajes registrados todavía.</td></tr>';
      return;
    }
    tbody.innerHTML = viajes.slice(0, 100).map((v) => `
      <tr>
        <td>${v.dispositivo_nombre || v.dispositivo}</td>
        <td>${v.direccion === "ida" ? "🔴 IDA" : "🔵 VUELTA"}</td>
        <td>${fmtFecha(v.inicio)}</td>
        <td>${fmtFecha(v.fin)}</td>
        <td>${v.distancia_km ? v.distancia_km.toFixed(2) + " km" : "--"}</td>
        <td>${v.velocidad_media_kmh ? v.velocidad_media_kmh.toFixed(1) + " km/h" : "--"}</td>
      </tr>
    `).join("");
  }

  cargarParadas();
  cargarPosiciones();
  cargarViajes();
})();
