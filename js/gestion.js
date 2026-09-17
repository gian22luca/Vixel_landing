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
      document.getElementById("linea-submit-btn").disabled = true;
    }
  }).catch(() => {});

  function fmtFecha(iso) {
    if (!iso) return "--";
    return new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  // ==================== LINEAS (ABM, dibujadas sobre mapa) ====================
  // El terminal2 y ruta_ida/ruta_vuelta se cargan haciendo click en el
  // mapa, no grabando un viaje real: un viaje real confunde una parada
  // real con una detencion por trafico o semaforo.
  // doubleClickZoom off: sin esto, dos clicks seguidos para marcar dos
  // puntos cercanos del recorrido se interpretan como zoom y se pierde uno.
  var lineaMap = L.map("linea-map", { doubleClickZoom: false }).setView([-34.6037, -58.3816], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(lineaMap);

  var lineaState = { terminal1: null, terminal2: null, rutaIda: [], rutaVuelta: [] };
  var lineaMode = null;
  var lineaLayers = { terminal1: null, terminal2: null, ida: null, vuelta: null };

  // Un click sobre un marker no llega al 'click' del mapa (Leaflet corta
  // la propagacion en los markers) — sin este handler, marcar un punto de
  // ruta justo donde ya esta una terminal (algo normal: la ruta arranca y
  // termina ahi) se perdia en silencio.
  function onMapOrMarkerClick(lat, lon) {
    if (!lineaMode) return;
    if (lineaMode === "terminal1") lineaState.terminal1 = { lat: lat, lon: lon };
    else if (lineaMode === "terminal2") lineaState.terminal2 = { lat: lat, lon: lon };
    else if (lineaMode === "ida") lineaState.rutaIda.push([lat, lon]);
    else if (lineaMode === "vuelta") lineaState.rutaVuelta.push([lat, lon]);
    redrawLineaMap();
  }

  function redrawLineaMap() {
    Object.keys(lineaLayers).forEach(function (k) {
      if (lineaLayers[k]) { lineaMap.removeLayer(lineaLayers[k]); lineaLayers[k] = null; }
    });
    if (lineaState.terminal1) {
      lineaLayers.terminal1 = L.marker([lineaState.terminal1.lat, lineaState.terminal1.lon], {
        icon: L.divIcon({ className: "terminal-marker", html: '<div style="background:green;width:18px;height:18px;border-radius:50%;border:3px solid white;"></div>', iconSize: [18, 18] }),
      }).addTo(lineaMap).bindPopup("Terminal 1")
        .on("click", function () { onMapOrMarkerClick(lineaState.terminal1.lat, lineaState.terminal1.lon); });
    }
    if (lineaState.terminal2) {
      lineaLayers.terminal2 = L.marker([lineaState.terminal2.lat, lineaState.terminal2.lon], {
        icon: L.divIcon({ className: "terminal-marker", html: '<div style="background:darkred;width:18px;height:18px;border-radius:50%;border:3px solid white;"></div>', iconSize: [18, 18] }),
      }).addTo(lineaMap).bindPopup("Terminal 2")
        .on("click", function () { onMapOrMarkerClick(lineaState.terminal2.lat, lineaState.terminal2.lon); });
    }
    if (lineaState.rutaIda.length > 1) {
      lineaLayers.ida = L.polyline(lineaState.rutaIda, { color: "red", weight: 3, opacity: 0.7 }).addTo(lineaMap);
    }
    if (lineaState.rutaVuelta.length > 1) {
      lineaLayers.vuelta = L.polyline(lineaState.rutaVuelta, { color: "blue", weight: 3, opacity: 0.7 }).addTo(lineaMap);
    }
  }

  var lineaHints = {
    terminal1: "Click en el mapa para ubicar la Terminal 1.",
    terminal2: "Click en el mapa para ubicar la Terminal 2.",
    ida: "Click en el mapa para ir agregando puntos del recorrido de IDA, en orden.",
    vuelta: "Click en el mapa para ir agregando puntos del recorrido de VUELTA, en orden.",
  };

  document.querySelectorAll(".linea-mode-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var wasActive = btn.classList.contains("active");
      document.querySelectorAll(".linea-mode-btn").forEach(function (b) { b.classList.remove("active"); });
      lineaMode = wasActive ? null : btn.dataset.mode;
      if (lineaMode) btn.classList.add("active");
      document.getElementById("linea-map-hint").textContent =
        lineaMode ? lineaHints[lineaMode] : "Elegí qué marcar y hacé click en el mapa.";
    });
  });

  lineaMap.on("click", function (e) {
    onMapOrMarkerClick(e.latlng.lat, e.latlng.lng);
  });

  document.getElementById("linea-undo-btn").addEventListener("click", function () {
    if (lineaMode === "ida") lineaState.rutaIda.pop();
    else if (lineaMode === "vuelta") lineaState.rutaVuelta.pop();
    else { alert("Elegí 'Dibujar recorrido IDA/VUELTA' para deshacer un punto."); return; }
    redrawLineaMap();
  });

  document.getElementById("linea-clear-btn").addEventListener("click", function () {
    if (lineaMode === "ida") lineaState.rutaIda = [];
    else if (lineaMode === "vuelta") lineaState.rutaVuelta = [];
    else { alert("Elegí 'Dibujar recorrido IDA/VUELTA' para limpiarlo."); return; }
    redrawLineaMap();
  });

  var lineaForm = document.getElementById("linea-form");
  var lineaAlert = document.getElementById("linea-alert");
  var lineaSubmitBtn = document.getElementById("linea-submit-btn");
  var lineaCancelBtn = document.getElementById("linea-cancel-btn");

  function setLineaAlert(tipo, msg) {
    lineaAlert.className = "app-alert " + tipo;
    lineaAlert.textContent = msg;
    lineaAlert.hidden = false;
  }

  function limpiarFormLinea() {
    lineaForm.reset();
    document.getElementById("linea-id").value = "";
    document.getElementById("linea-activa").checked = true;
    lineaSubmitBtn.textContent = "Agregar línea";
    lineaCancelBtn.hidden = true;
    lineaState = { terminal1: null, terminal2: null, rutaIda: [], rutaVuelta: [] };
    lineaMode = null;
    document.querySelectorAll(".linea-mode-btn").forEach(function (b) { b.classList.remove("active"); });
    document.getElementById("linea-map-hint").textContent = "Elegí qué marcar y hacé click en el mapa.";
    redrawLineaMap();
  }

  async function cargarLineas() {
    var tbody = document.getElementById("lineas-tbody");
    var resp = await VixelAuth.apiFetch("/api/lineas/");
    if (!resp.ok) {
      tbody.innerHTML = '<tr><td colspan="6" class="gestion-empty">No se pudo cargar (' + resp.status + ")</td></tr>";
      return;
    }
    var lineas = await resp.json();
    if (lineas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="gestion-empty">Sin líneas cargadas todavía.</td></tr>';
      return;
    }
    tbody.innerHTML = lineas.map(function (l) {
      return "<tr>" +
        "<td>" + l.nombre + "</td>" +
        "<td>" + l.terminal1_nombre + "</td>" +
        "<td>" + l.terminal2_nombre + "</td>" +
        "<td>" + l.ruta_ida.length + " / " + l.ruta_vuelta.length + "</td>" +
        "<td>" + (l.activa ? "Sí" : "No") + "</td>" +
        "<td>" + (esAdmin ?
          '<button class="gestion-row-btn edit" data-id="' + l.id + '">Editar</button>' +
          '<button class="gestion-row-btn delete" data-id="' + l.id + '">Borrar</button>' : "") +
        "</td></tr>";
    }).join("");

    tbody.querySelectorAll(".edit").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var l = lineas.find(function (x) { return String(x.id) === btn.dataset.id; });
        document.getElementById("linea-id").value = l.id;
        document.getElementById("linea-nombre").value = l.nombre;
        document.getElementById("linea-t1-nombre").value = l.terminal1_nombre;
        document.getElementById("linea-t2-nombre").value = l.terminal2_nombre;
        document.getElementById("linea-activa").checked = l.activa;
        lineaState = {
          terminal1: (l.terminal1_lat != null && l.terminal1_lon != null) ? { lat: l.terminal1_lat, lon: l.terminal1_lon } : null,
          terminal2: (l.terminal2_lat != null && l.terminal2_lon != null) ? { lat: l.terminal2_lat, lon: l.terminal2_lon } : null,
          rutaIda: (l.ruta_ida || []).slice(),
          rutaVuelta: (l.ruta_vuelta || []).slice(),
        };
        redrawLineaMap();
        var bounds = [];
        if (lineaState.terminal1) bounds.push([lineaState.terminal1.lat, lineaState.terminal1.lon]);
        if (lineaState.terminal2) bounds.push([lineaState.terminal2.lat, lineaState.terminal2.lon]);
        bounds = bounds.concat(lineaState.rutaIda).concat(lineaState.rutaVuelta);
        if (bounds.length) lineaMap.fitBounds(bounds, { padding: [20, 20] });
        lineaSubmitBtn.textContent = "Guardar cambios";
        lineaCancelBtn.hidden = false;
        lineaForm.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    tbody.querySelectorAll(".delete").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        if (!confirm("¿Borrar esta línea? No se puede deshacer.")) return;
        var resp = await VixelAuth.apiFetch("/api/lineas/" + btn.dataset.id + "/", { method: "DELETE" });
        if (resp.ok || resp.status === 204) {
          setLineaAlert("ok", "Línea borrada.");
          cargarLineas();
        } else {
          setLineaAlert("error", "No se pudo borrar (" + resp.status + ")");
        }
      });
    });
  }

  lineaCancelBtn.addEventListener("click", limpiarFormLinea);

  lineaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!lineaState.terminal1 || !lineaState.terminal2) {
      setLineaAlert("error", "Marcá la Terminal 1 y la Terminal 2 en el mapa antes de guardar.");
      return;
    }
    const id = document.getElementById("linea-id").value;
    const payload = {
      nombre: document.getElementById("linea-nombre").value,
      terminal1_nombre: document.getElementById("linea-t1-nombre").value,
      terminal1_lat: lineaState.terminal1.lat,
      terminal1_lon: lineaState.terminal1.lon,
      terminal2_nombre: document.getElementById("linea-t2-nombre").value,
      terminal2_lat: lineaState.terminal2.lat,
      terminal2_lon: lineaState.terminal2.lon,
      ruta_ida: lineaState.rutaIda,
      ruta_vuelta: lineaState.rutaVuelta,
      activa: document.getElementById("linea-activa").checked,
    };

    lineaSubmitBtn.disabled = true;
    try {
      const url = id ? "/api/lineas/" + id + "/" : "/api/lineas/";
      const method = id ? "PATCH" : "POST";
      const resp = await VixelAuth.apiFetch(url, { method, body: JSON.stringify(payload) });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || JSON.stringify(err));
      }
      setLineaAlert("ok", id ? "Línea actualizada." : "Línea agregada.");
      limpiarFormLinea();
      cargarLineas();
    } catch (err) {
      setLineaAlert("error", "No se pudo guardar: " + err.message);
    } finally {
      lineaSubmitBtn.disabled = !esAdmin ? true : false;
    }
  });

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

  cargarLineas();
  cargarParadas();
  cargarPosiciones();
  cargarViajes();
})();
