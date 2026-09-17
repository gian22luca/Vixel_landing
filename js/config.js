// Configuracion remota del dispositivo - reemplaza a control_remoto.html.
// A diferencia de la version vieja, esto ya NO maneja ninguna API key de
// ThingSpeak en el navegador: habla contra el backend propio con el JWT
// del login. Solo el rol "admin" puede guardar cambios (lo hace cumplir
// el backend, no solo esta pagina).

(function () {
  var token = VixelAuth.requireAuth();
  if (!token) return;

  document.getElementById("logout-btn").addEventListener("click", VixelAuth.logout);

  var select = document.getElementById("dispositivo-select");
  var alertBox = document.getElementById("config-alert");
  var form = document.getElementById("config-form");
  var guardarBtn = document.getElementById("guardar-btn");
  var dispositivos = [];

  function setAlert(tipo, mensaje) {
    alertBox.className = "app-alert " + tipo;
    alertBox.textContent = mensaje;
    alertBox.hidden = false;
  }

  VixelAuth.apiFetch("/api/auth/perfil/").then(function (r) { return r.ok ? r.json() : null; }).then(function (perfil) {
    if (!perfil) return;
    document.getElementById("app-user").textContent = perfil.username + " · " + perfil.rol;
    if (perfil.rol !== "admin") {
      guardarBtn.disabled = true;
      guardarBtn.title = "Solo un usuario admin puede guardar cambios.";
    }
  }).catch(function () {});

  async function cargarDispositivos() {
    var resp = await VixelAuth.apiFetch("/api/dispositivos/");
    if (!resp.ok) {
      setAlert("error", "No se pudieron cargar los dispositivos (" + resp.status + ").");
      return;
    }
    dispositivos = await resp.json();
    if (dispositivos.length === 0) {
      setAlert("error", "No hay dispositivos cargados todavía. Un admin puede crear uno desde /admin/.");
      return;
    }
    select.innerHTML = dispositivos.map(function (d) {
      return '<option value="' + d.id + '">' + d.nombre + "</option>";
    }).join("");
    cargarConfiguracion(dispositivos[0].id);
  }

  async function cargarConfiguracion(dispositivoId) {
    form.hidden = true;
    setAlert("info", "Cargando configuración...");
    var resp = await VixelAuth.apiFetch("/api/dispositivos/" + dispositivoId + "/configuracion/");
    if (!resp.ok) {
      setAlert("error", "No se pudo leer la configuración (" + resp.status + ").");
      return;
    }
    var config = await resp.json();
    document.getElementById("volumen").value = config.volumen;
    document.getElementById("volumen-valor").textContent = config.volumen;
    document.getElementById("texto").value = config.texto_default;
    document.getElementById("radio").value = config.radio_deteccion_parada_m;
    document.getElementById("intervalo").value = config.intervalo_subida_s;
    alertBox.hidden = true;
    form.hidden = false;
  }

  select.addEventListener("change", function () {
    cargarConfiguracion(select.value);
  });

  document.getElementById("volumen").addEventListener("input", function (e) {
    document.getElementById("volumen-valor").textContent = e.target.value;
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    guardarBtn.disabled = true;
    guardarBtn.textContent = "Guardando...";

    var payload = {
      volumen: parseInt(document.getElementById("volumen").value, 10),
      texto_default: document.getElementById("texto").value || "LINEA 102 - VIXEL",
      radio_deteccion_parada_m: parseInt(document.getElementById("radio").value, 10),
      intervalo_subida_s: parseInt(document.getElementById("intervalo").value, 10),
    };

    try {
      var resp = await VixelAuth.apiFetch("/api/dispositivos/" + select.value + "/configuracion/", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        var err = await resp.json().catch(function () { return {}; });
        throw new Error(err.detail || Object.values(err)[0] || ("Error " + resp.status));
      }
      setAlert("ok", "Dispositivo actualizado. Toma los cambios en menos de 60 segundos.");
      form.hidden = false;
    } catch (err) {
      setAlert("error", "No se pudo guardar: " + err.message);
      form.hidden = false;
    } finally {
      guardarBtn.disabled = false;
      guardarBtn.textContent = "Guardar cambios";
    }
  });

  cargarDispositivos();
})();
