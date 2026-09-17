// Panel de seguimiento en tiempo real - portado de tracker-gps/index.html.
//
// Nota de alcance: esta pagina sigue consultando ThingSpeak directo desde
// el navegador para la posicion GPS (igual que antes), NO todavia via el
// backend Django. Lo que sí cambia es que ahora esta detras de login. El
// paso de mover posiciones/historial al backend (poller de ThingSpeak ->
// Posicion, calculo server-side de Viaje/Desvio) es un paso siguiente
// documentado en backend/README.md del repo tracker-gps.

(function () {
  var token = VixelAuth.requireAuth();
  if (!token) return; // requireAuth ya redirigio a /login/

  document.getElementById("logout-btn").addEventListener("click", VixelAuth.logout);

  // Trae el perfil solo para mostrar el usuario logueado en la topbar.
  VixelAuth.apiFetch("/api/auth/perfil/").then(function (resp) {
    if (!resp.ok) return;
    resp.json().then(function (perfil) {
      document.getElementById("app-user").textContent = perfil.username + " · " + perfil.rol;
    });
  }).catch(function () {});

  // ==================== CONFIGURACIÓN DE DISPOSITIVOS ====================
  // Para agregar un dispositivo: crear canal en ThingSpeak y añadir una linea aqui
  var DEVICES = [
    { id: "bus1", name: "Interno 1", channel: "3264955", color: "#e74c3c" },
    // { id: "bus2", name: "Bus 2", channel: "TU_CHANNEL_ID", color: "#2563eb" },
  ];

  var ds = {};
  DEVICES.forEach(function (dev) {
    ds[dev.id] = {
      enabled: true, marker: null, circle: null, position: null,
      tripState: "waiting", tripDirection: null, tripStartTime: null, tripEndTime: null,
      deviations: [], offRouteCount: 0, currentlyOffRoute: false,
      timerInterval: null, tripPositions: [], tripTotalDist: 0,
      countIda: 0, countVuelta: 0,
    };
  });

  var focusedDeviceId = DEVICES[0].id;

  var map = L.map("map").setView([-34.6037, -58.3816], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Valores de arranque — se pisan con lo que devuelva /api/lineas/ (ver
  // cargarLinea() mas abajo) en cuanto responda. Quedan como fallback para
  // no dejar el mapa vacio si todavia no se cargo ninguna Linea desde
  // /gestion/, o si la llamada a la API falla.
  var terminal1 = [-34.64156342985639, -58.36911794252859];
  var terminal2 = [-34.57382497011297, -58.40973918613616];

  var rutaIda = [
    [-34.573799, -58.409758], [-34.574018, -58.409436], [-34.574189, -58.409071], [-34.574312, -58.408881],
    [-34.574425, -58.408706], [-34.574597, -58.408492], [-34.574769, -58.408341], [-34.575155, -58.40817],
    [-34.575562, -58.408556], [-34.575927, -58.409071], [-34.576442, -58.40965], [-34.577193, -58.409994],
    [-34.577816, -58.408599], [-34.578116, -58.407934], [-34.578652, -58.406882], [-34.57921, -58.406281],
    [-34.579554, -58.405874], [-34.579833, -58.405552], [-34.580511, -58.404614], [-34.58105, -58.403965],
    [-34.581376, -58.403498], [-34.581721, -58.402506], [-34.582064, -58.401561], [-34.583416, -58.402054],
    [-34.583867, -58.401217], [-34.584446, -58.400552], [-34.585004, -58.39993], [-34.585733, -58.399179],
    [-34.585862, -58.398964], [-34.586527, -58.398256], [-34.587162, -58.397536], [-34.58745, -58.397248],
    [-34.588008, -58.396518], [-34.588544, -58.395853], [-34.589317, -58.39493], [-34.590089, -58.393986],
    [-34.590926, -58.392935], [-34.591763, -58.391862], [-34.590905, -58.390918], [-34.590046, -58.389952],
    [-34.59084, -58.388944], [-34.591634, -58.387957], [-34.592814, -58.38757], [-34.594617, -58.387291],
    [-34.595711, -58.387141], [-34.597063, -58.387055], [-34.598286, -58.38697], [-34.599273, -58.386862],
    [-34.600625, -58.386734], [-34.601634, -58.386691], [-34.602764, -58.386655], [-34.60402, -58.386541],
    [-34.605238, -58.386476], [-34.606462, -58.386369], [-34.607653, -58.386315], [-34.6088, -58.386283],
    [-34.60938, -58.386261], [-34.609981, -58.386219], [-34.611075, -58.386154], [-34.612298, -58.386154],
    [-34.61345, -58.386061], [-34.614554, -58.385965], [-34.615517, -58.385918], [-34.616675, -58.385897],
    [-34.617813, -58.385875], [-34.618671, -58.385854], [-34.619851, -58.385832], [-34.621139, -58.385832],
    [-34.622362, -58.385811], [-34.62322, -58.385832], [-34.623563, -58.385832], [-34.623928, -58.385811],
    [-34.624743, -58.385789], [-34.626095, -58.385746], [-34.627039, -58.385725], [-34.627018, -58.384352],
    [-34.626932, -58.38285], [-34.626906, -58.382255], [-34.627333, -58.382236], [-34.627372, -58.382202],
    [-34.627532, -58.382001], [-34.627611, -58.381921], [-34.627638, -58.381843], [-34.627613, -58.381146],
    [-34.6276, -58.380529], [-34.627589, -58.379838], [-34.627712, -58.379603], [-34.629312, -58.379034],
    [-34.629872, -58.378816], [-34.630215, -58.378687], [-34.630258, -58.378644], [-34.630344, -58.378451],
    [-34.630301, -58.378129], [-34.630172, -58.378], [-34.629979, -58.3777], [-34.629722, -58.377249],
    [-34.630065, -58.377035], [-34.630816, -58.376713], [-34.632189, -58.376155], [-34.633241, -58.37579],
    [-34.634421, -58.375404], [-34.634593, -58.375361], [-34.635258, -58.375211], [-34.636159, -58.375039],
    [-34.637189, -58.374867], [-34.637833, -58.374717], [-34.638669, -58.374588], [-34.639657, -58.374417],
    [-34.6403, -58.37431], [-34.640558, -58.374245], [-34.641588, -58.374052], [-34.64148, -58.372808],
    [-34.641373, -58.371799], [-34.641309, -58.37079], [-34.641116, -58.369095], [-34.641931, -58.368967],
  ];

  var rutaVuelta = [
    [-34.641931, -58.368967], [-34.642167, -58.370597], [-34.642231, -58.371627], [-34.642317, -58.372657],
    [-34.642438, -58.373868], [-34.641588, -58.374052], [-34.640558, -58.374245], [-34.6403, -58.37431],
    [-34.639657, -58.374417], [-34.638669, -58.374588], [-34.637833, -58.374717], [-34.637189, -58.374867],
    [-34.636159, -58.375039], [-34.636098, -58.375051], [-34.635258, -58.375211], [-34.634593, -58.375361],
    [-34.634421, -58.375404], [-34.633241, -58.37579], [-34.632189, -58.376155], [-34.630816, -58.376713],
    [-34.630065, -58.377035], [-34.629722, -58.377249], [-34.62955, -58.377357], [-34.628563, -58.377936],
    [-34.627426, -58.378472], [-34.626404, -58.378868], [-34.626265, -58.379059], [-34.626151, -58.379339],
    [-34.626374, -58.380168], [-34.626873, -58.379962], [-34.627042, -58.380011], [-34.627158, -58.380018],
    [-34.627264, -58.380135], [-34.627312, -58.380295], [-34.627347, -58.381772], [-34.627293, -58.381997],
    [-34.627178, -58.382131], [-34.626934, -58.382156], [-34.625914, -58.382195], [-34.624773, -58.382263],
    [-34.624654, -58.382349], [-34.624658, -58.382936], [-34.624701, -58.384395], [-34.624743, -58.385789],
    [-34.624829, -58.387184], [-34.624014, -58.387184], [-34.623778, -58.387184], [-34.623306, -58.387184],
    [-34.622447, -58.387163], [-34.621246, -58.387206], [-34.619937, -58.387313], [-34.618778, -58.38742],
    [-34.617877, -58.387463], [-34.616697, -58.387485], [-34.615538, -58.387463], [-34.614658, -58.387494],
    [-34.613544, -58.387489], [-34.612386, -58.387463], [-34.611161, -58.387485], [-34.610022, -58.387589],
    [-34.609846, -58.387356], [-34.60973, -58.387298], [-34.609457, -58.38731], [-34.609096, -58.387344],
    [-34.609004, -58.387422], [-34.608916, -58.387609], [-34.608866, -58.387679], [-34.607751, -58.387734],
    [-34.606547, -58.387828], [-34.605402, -58.387905], [-34.60413, -58.387926], [-34.602918, -58.387952],
    [-34.601698, -58.388042], [-34.600673, -58.388109], [-34.599316, -58.38815], [-34.598379, -58.388206],
    [-34.597149, -58.3883], [-34.595765, -58.388355], [-34.59466, -58.388557], [-34.592836, -58.388772],
    [-34.59275, -58.388772], [-34.592514, -58.389008], [-34.591699, -58.389931], [-34.590905, -58.390918],
    [-34.590089, -58.391948], [-34.589231, -58.393042], [-34.590089, -58.393986], [-34.589317, -58.39493],
    [-34.588544, -58.395853], [-34.588008, -58.396518], [-34.58745, -58.397248], [-34.58715, -58.397548],
    [-34.586527, -58.398256], [-34.585862, -58.398964], [-34.585733, -58.399179], [-34.585004, -58.39993],
    [-34.584446, -58.400552], [-34.583867, -58.401217], [-34.583416, -58.402054], [-34.583437, -58.404028],
    [-34.58346, -58.405316], [-34.58263, -58.40471], [-34.58195, -58.404158], [-34.5815, -58.403793],
    [-34.581376, -58.403498], [-34.58124, -58.403161], [-34.580841, -58.403041], [-34.57994, -58.40302],
    [-34.579146, -58.402934], [-34.578674, -58.402762], [-34.578223, -58.402634], [-34.577601, -58.403471],
    [-34.576528, -58.40493], [-34.575799, -58.405809], [-34.575176, -58.406646], [-34.574575, -58.40759],
    [-34.572215, -58.410959], [-34.571829, -58.411753], [-34.572065, -58.411989], [-34.572237, -58.411968],
    [-34.57273, -58.410959], [-34.573138, -58.410466], [-34.573567, -58.410101], [-34.573799, -58.409758],
  ];

  var polylineIda = null, polylineVuelta = null, terminal1Marker = null, terminal2Marker = null;

  function drawRouteLayers() {
    if (polylineIda) map.removeLayer(polylineIda);
    if (polylineVuelta) map.removeLayer(polylineVuelta);
    if (terminal1Marker) map.removeLayer(terminal1Marker);
    if (terminal2Marker) map.removeLayer(terminal2Marker);

    polylineIda = L.polyline(rutaIda, { color: "red", weight: 3, opacity: 0.7 }).addTo(map).bindPopup("Recorrido IDA");
    polylineVuelta = L.polyline(rutaVuelta, { color: "blue", weight: 3, opacity: 0.7 }).addTo(map).bindPopup("Recorrido VUELTA");
    if (!document.getElementById("show-ida").checked) map.removeLayer(polylineIda);
    if (!document.getElementById("show-vuelta").checked) map.removeLayer(polylineVuelta);

    terminal1Marker = L.marker(terminal1, {
      icon: L.divIcon({ className: "terminal-marker", html: '<div style="background-color:green;width:20px;height:20px;border-radius:50%;border:3px solid white;"></div>', iconSize: [20, 20] }),
    }).addTo(map).bindPopup("<b>Terminal 1</b><br>Inicio del recorrido");

    terminal2Marker = L.marker(terminal2, {
      icon: L.divIcon({ className: "terminal-marker", html: '<div style="background-color:darkred;width:20px;height:20px;border-radius:50%;border:3px solid white;"></div>', iconSize: [20, 20] }),
    }).addTo(map).bindPopup("<b>Terminal 2</b><br>Fin del recorrido");
  }

  drawRouteLayers();

  document.getElementById("show-ida").addEventListener("change", function (e) {
    if (e.target.checked) map.addLayer(polylineIda); else map.removeLayer(polylineIda);
  });
  document.getElementById("show-vuelta").addEventListener("change", function (e) {
    if (e.target.checked) map.addLayer(polylineVuelta); else map.removeLayer(polylineVuelta);
  });
  document.getElementById("center-gps-btn").addEventListener("click", function () {
    var pos = ds[focusedDeviceId].position;
    if (pos) map.setView(pos, 15); else alert("Aún no hay datos de GPS disponibles");
  });

  // Pisa terminal1/terminal2/rutaIda/rutaVuelta con la Linea activa cargada
  // desde /gestion/, si existe. No bloquea el resto de la inicializacion:
  // el mapa ya se dibuja con el fallback de arriba, y esto lo redibuja en
  // cuanto responde (o lo deja como esta si no hay ninguna Linea todavia,
  // o si la request falla).
  function cargarLinea() {
    VixelAuth.apiFetch("/api/lineas/").then(function (resp) {
      return resp.ok ? resp.json() : [];
    }).then(function (lineas) {
      var linea = lineas.find(function (l) { return l.activa; }) || lineas[0];
      if (!linea || linea.terminal1_lat == null || linea.terminal2_lat == null) return;

      terminal1 = [linea.terminal1_lat, linea.terminal1_lon];
      terminal2 = [linea.terminal2_lat, linea.terminal2_lon];
      if (linea.ruta_ida && linea.ruta_ida.length > 1) rutaIda = linea.ruta_ida;
      if (linea.ruta_vuelta && linea.ruta_vuelta.length > 1) rutaVuelta = linea.ruta_vuelta;
      drawRouteLayers();
    }).catch(function () { /* se queda con el fallback hardcodeado */ });
  }
  cargarLinea();

  // ==================== SELECTOR DE DISPOSITIVOS ====================
  function renderDeviceSelector() {
    var container = document.getElementById("device-selector");
    container.innerHTML = "";
    DEVICES.forEach(function (dev) {
      var d = ds[dev.id];
      var isFocused = dev.id === focusedDeviceId;
      var btn = document.createElement("button");
      btn.className = "device-btn" + (d.enabled ? " active" : "") + (isFocused ? " focused" : "");
      btn.style.setProperty("--dev-color", dev.color);
      btn.innerHTML = '<span class="dev-dot" style="background:' + (d.enabled ? dev.color : "#ccc") + '"></span><span>' + dev.name + "</span>";
      btn.title = d.enabled ? (isFocused ? "Desactivar " + dev.name : "Ver estadísticas de " + dev.name) : "Activar " + dev.name;

      btn.addEventListener("click", function () {
        if (!d.enabled) {
          d.enabled = true;
          focusedDeviceId = dev.id;
        } else if (!isFocused) {
          focusedDeviceId = dev.id;
        } else {
          var otrosActivos = DEVICES.filter(function (x) { return ds[x.id].enabled && x.id !== dev.id; });
          if (otrosActivos.length > 0) {
            d.enabled = false;
            if (d.marker) { map.removeLayer(d.marker); d.marker = null; }
            if (d.circle) { map.removeLayer(d.circle); d.circle = null; }
            focusedDeviceId = otrosActivos[0].id;
          }
        }
        renderDeviceSelector();
        updatePanel();
      });
      container.appendChild(btn);
    });
  }

  // ==================== LÓGICA DE SEGUIMIENTO DE RECORRIDO ====================
  var TERMINAL_RADIUS_M = 100;
  var DEVIATION_THRESHOLD_M = 100;
  var DEVIATION_DEBOUNCE = 3;

  function haversineDistance(lat1, lon1, lat2, lon2) {
    var R = 6371000;
    var phi1 = lat1 * Math.PI / 180;
    var phi2 = lat2 * Math.PI / 180;
    var dphi = (lat2 - lat1) * Math.PI / 180;
    var dlam = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function distanceToRoute(lat, lon, route) {
    var minDist = Infinity;
    for (var i = 0; i < route.length; i++) {
      var d = haversineDistance(lat, lon, route[i][0], route[i][1]);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  function isNearTerminal(lat, lon, terminal) {
    return haversineDistance(lat, lon, terminal[0], terminal[1]) <= TERMINAL_RADIUS_M;
  }

  function formatDuration(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  }

  function formatTime(date) {
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function updatePanel() {
    var d = ds[focusedDeviceId];
    var dev = DEVICES.find(function (x) { return x.id === focusedDeviceId; });
    var badge = document.getElementById("trip-badge");
    var resetBtn = document.getElementById("reset-trip-btn");

    document.querySelector("#trip-panel h3").textContent = "Estadísticas · " + dev.name;
    document.getElementById("count-ida").textContent = d.countIda;
    document.getElementById("count-vuelta").textContent = d.countVuelta;

    if (d.tripState === "waiting") {
      badge.className = "trip-badge badge-waiting";
      badge.textContent = "⏳ Esperando salida";
      resetBtn.style.display = "none";
    } else if (d.tripState === "in_progress") {
      if (d.tripDirection === "vuelta") {
        badge.className = "trip-badge badge-vuelta";
        badge.textContent = "🔵 VUELTA en curso (T1→T2)";
      } else {
        badge.className = "trip-badge badge-ida";
        badge.textContent = "🔴 IDA en curso (T2→T1)";
      }
      resetBtn.className = "";
      resetBtn.style.display = "block";
    } else if (d.tripState === "completed") {
      if (d.tripDirection === "vuelta") {
        badge.className = "trip-badge badge-done-vuelta";
        badge.textContent = "✅ VUELTA completada";
      } else {
        badge.className = "trip-badge badge-done-ida";
        badge.textContent = "✅ IDA completada";
      }
      resetBtn.className = "primary";
      resetBtn.style.display = "block";
    }

    document.getElementById("stat-start").textContent = d.tripStartTime ? formatTime(d.tripStartTime) : "--:--:--";
    document.getElementById("stat-end").textContent = d.tripEndTime ? formatTime(d.tripEndTime) : "--:--:--";

    var elapsedMs = 0;
    if (d.tripState === "in_progress" && d.tripStartTime) {
      elapsedMs = Date.now() - d.tripStartTime.getTime();
      document.getElementById("stat-elapsed").textContent = formatDuration(elapsedMs);
    } else if (d.tripState === "completed" && d.tripStartTime && d.tripEndTime) {
      elapsedMs = d.tripEndTime.getTime() - d.tripStartTime.getTime();
      document.getElementById("stat-elapsed").textContent = formatDuration(elapsedMs);
    } else {
      document.getElementById("stat-elapsed").textContent = "00:00:00";
    }

    var elapsedHours = elapsedMs / 3600000;
    var distKm = d.tripTotalDist / 1000;
    if (elapsedHours > 0 && distKm > 0) {
      document.getElementById("stat-speed").textContent = (distKm / elapsedHours).toFixed(1) + " km/h";
      document.getElementById("stat-odometer").textContent = distKm.toFixed(2) + " km";
    } else {
      document.getElementById("stat-speed").textContent = "-- km/h";
      document.getElementById("stat-odometer").textContent = "-- km";
    }

    var devCountBox = document.getElementById("dev-count-box");
    document.getElementById("stat-dev-count").textContent = d.deviations.length;
    devCountBox.className = d.deviations.length === 0 ? "deviation-count-box ok" : "deviation-count-box bad";

    var devList = document.getElementById("deviation-list");
    if (d.deviations.length === 0) {
      devList.innerHTML = '<p class="no-deviations">✓ Sin desvíos registrados</p>';
    } else {
      devList.innerHTML = d.deviations.map(function (dev2) {
        return '<div class="deviation-item"><span class="dev-time">' + formatTime(dev2.time) + '</span><br><span class="dev-dist">⚠ ' + dev2.distance + ' m fuera de ruta</span></div>';
      }).join("");
    }
  }

  function updateDistanceDisplay(distMeters, tripDirection) {
    var distBox = document.getElementById("dist-box");
    var distVal = document.getElementById("stat-dist");
    var distLabel = document.getElementById("dist-label");

    if (distMeters === null) {
      distVal.textContent = "--";
      distBox.className = "distance-box normal";
      distLabel.textContent = "Distancia a ruta";
      return;
    }
    distVal.textContent = Math.round(distMeters);
    distLabel.textContent = tripDirection === "ida" ? "Distancia a ruta roja" : "Distancia a ruta azul";
    distBox.className = distMeters > DEVIATION_THRESHOLD_M ? "distance-box alert" : "distance-box normal";
  }

  function processTripUpdate(lat, lon, deviceId) {
    var d = ds[deviceId];
    var now = new Date();
    var isFocused = deviceId === focusedDeviceId;

    if (d.tripState === "waiting") {
      if (isNearTerminal(lat, lon, terminal1)) startTrip("vuelta", now, lat, lon, deviceId);
      else if (isNearTerminal(lat, lon, terminal2)) startTrip("ida", now, lat, lon, deviceId);
    } else if (d.tripState === "in_progress") {
      var activeRoute = d.tripDirection === "vuelta" ? rutaVuelta : rutaIda;
      var destinationTerminal = d.tripDirection === "vuelta" ? terminal2 : terminal1;

      var lastPos = d.tripPositions[d.tripPositions.length - 1];
      var stepDist = haversineDistance(lastPos[0], lastPos[1], lat, lon);
      if (stepDist < 500) d.tripTotalDist += stepDist;
      d.tripPositions.push([lat, lon]);

      var distFromRoute = distanceToRoute(lat, lon, activeRoute);
      if (isFocused) updateDistanceDisplay(distFromRoute, d.tripDirection);

      if (distFromRoute > DEVIATION_THRESHOLD_M) {
        d.offRouteCount++;
        if (d.offRouteCount === DEVIATION_DEBOUNCE && !d.currentlyOffRoute) {
          d.currentlyOffRoute = true;
          d.deviations.push({ time: now, distance: Math.round(distFromRoute) });
        }
      } else {
        d.offRouteCount = 0;
        d.currentlyOffRoute = false;
      }

      if (isNearTerminal(lat, lon, destinationTerminal)) {
        d.tripState = "completed";
        d.tripEndTime = now;
        if (d.tripDirection === "vuelta") d.countVuelta++; else d.countIda++;
        if (d.timerInterval) clearInterval(d.timerInterval);
        d.timerInterval = null;
        saveTrip(deviceId, d);
      }
    } else if (d.tripState === "completed") {
      var arrivalTerminal = d.tripDirection === "vuelta" ? terminal2 : terminal1;
      if (!isNearTerminal(lat, lon, arrivalTerminal)) {
        d.tripState = "waiting";
        d.tripDirection = null;
        if (isFocused) updateDistanceDisplay(null, null);
      }
    }

    if (isFocused) updatePanel();
  }

  function startTrip(direction, startTime, startLat, startLon, deviceId) {
    var d = ds[deviceId];
    d.tripState = "in_progress";
    d.tripDirection = direction;
    d.tripStartTime = startTime;
    d.tripEndTime = null;
    d.deviations = [];
    d.offRouteCount = 0;
    d.currentlyOffRoute = false;
    d.tripPositions = [[startLat, startLon]];
    d.tripTotalDist = 0;
    if (deviceId === focusedDeviceId) updateDistanceDisplay(null, null);
    if (d.timerInterval) clearInterval(d.timerInterval);
    d.timerInterval = setInterval(updatePanel, 1000);
  }

  document.getElementById("reset-trip-btn").addEventListener("click", function () {
    var d = ds[focusedDeviceId];
    if (d.timerInterval) clearInterval(d.timerInterval);
    d.timerInterval = null;
    d.tripState = "waiting";
    d.tripDirection = null;
    d.tripStartTime = null;
    d.tripEndTime = null;
    d.deviations = [];
    d.offRouteCount = 0;
    d.currentlyOffRoute = false;
    d.tripPositions = [];
    d.tripTotalDist = 0;
    updateDistanceDisplay(null, null);
    updatePanel();
  });

  // ==================== ACTUALIZACIÓN DE POSICIÓN GPS ====================
  function updateLocation(dev) {
    var d = ds[dev.id];
    if (!d.enabled) return;

    fetch("https://api.thingspeak.com/channels/" + dev.channel + "/feeds/last.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.field1 == null) return;
        var lat = parseFloat(data.field1);
        var lon = parseFloat(data.field2);
        var hdop = data.field3 ? parseFloat(data.field3) : 5.0;
        var accuracyRadius = hdop * 10;
        var time = data.created_at;

        if (d.marker) {
          d.marker.setLatLng([lat, lon]);
          d.circle.setLatLng([lat, lon]);
          d.circle.setRadius(accuracyRadius);
        } else {
          d.marker = L.marker([lat, lon], {
            icon: L.divIcon({
              className: "",
              html: '<div style="background:' + dev.color + ';width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
              iconSize: [14, 14], iconAnchor: [7, 7],
            }),
          }).addTo(map).bindPopup("<b>" + dev.name + "</b>");
          d.circle = L.circle([lat, lon], { color: dev.color, fillColor: dev.color, fillOpacity: 0.1, radius: accuracyRadius }).addTo(map);
          if (dev.id === focusedDeviceId) map.setView([lat, lon], 15);
        }

        d.position = [lat, lon];
        processTripUpdate(lat, lon, dev.id);
        renderDeviceSelector();

        if (dev.id === focusedDeviceId) {
          document.getElementById("status").innerHTML =
            "<b>" + dev.name + " · Última actualización:</b><br>" + time + "<br>" +
            "Lat: " + lat + "<br>Lon: " + lon + "<br>Precisión: +/- " + accuracyRadius.toFixed(1) + " m";
          if (data.field4 != null) {
            updateDataMeter(parseInt(data.field4), parseInt(data.field5), parseInt(data.field6), parseInt(data.field7));
          }
        }
      })
      .catch(function (err) { console.error("[" + dev.name + "] Error:", err); });
  }

  // ==================== MEDIDOR DE CONSUMO DE DATOS ====================
  var DATA_BAR_MAX_BYTES = 10 * 1024 * 1024;

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function secsToHMS(totalSec) {
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function updateDataMeter(bsent, brecv, reqs, uptimeSec) {
    if (bsent == null) return;
    var total = bsent + brecv;
    var rateKBh = uptimeSec > 0 ? ((total / 1024) / (uptimeSec / 3600)).toFixed(1) : "0";
    var barPct = Math.min((total / DATA_BAR_MAX_BYTES) * 100, 100);

    document.getElementById("dm-sent").textContent = formatBytes(bsent);
    document.getElementById("dm-recv").textContent = formatBytes(brecv);
    document.getElementById("dm-total").textContent = formatBytes(total);
    document.getElementById("dm-requests").textContent = reqs;
    document.getElementById("dm-rate").textContent = rateKBh + " KB/h";
    document.getElementById("dm-uptime").textContent = secsToHMS(uptimeSec);
    document.getElementById("dm-bar").style.width = barPct + "%";
  }

  // ==================== HISTORIAL DE VIAJES (localStorage) ====================
  var MAX_HISTORY = 500;
  var LS_KEY = "gps_trip_history";

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch (e) { return []; }
  }

  function persistHistory(history) {
    localStorage.setItem(LS_KEY, JSON.stringify(history));
  }

  function saveTrip(deviceId, d) {
    var dev = DEVICES.find(function (x) { return x.id === deviceId; });
    var elapsedMs = d.tripEndTime.getTime() - d.tripStartTime.getTime();
    var elapsedH = elapsedMs / 3600000;
    var distKm = d.tripTotalDist / 1000;
    var avgSpeed = elapsedH > 0 && distKm > 0 ? distKm / elapsedH : 0;

    var trip = {
      id: Date.now(), deviceId: deviceId,
      deviceName: dev ? dev.name : deviceId, deviceColor: dev ? dev.color : "#999",
      direction: d.tripDirection,
      startTime: d.tripStartTime.toISOString(), endTime: d.tripEndTime.toISOString(),
      elapsedMs: elapsedMs, avgSpeedKmh: parseFloat(avgSpeed.toFixed(1)), distanceKm: parseFloat(distKm.toFixed(2)),
      deviationCount: d.deviations.length,
      deviations: d.deviations.map(function (dv) { return { time: dv.time.toISOString(), distance: dv.distance }; }),
    };

    var history = loadHistory();
    history.unshift(trip);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    persistHistory(history);
  }

  function renderHistoryModal() {
    var history = loadHistory();
    var content = document.getElementById("history-content");

    if (history.length === 0) {
      content.innerHTML = '<p class="no-history">No hay viajes registrados aún.</p>';
      return;
    }

    var rows = history.map(function (trip) {
      var start = new Date(trip.startTime);
      var end = new Date(trip.endTime);
      var dateStr = start.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
      var startStr = start.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      var endStr = end.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      var dur = formatDuration(trip.elapsedMs);
      var dirBadge = trip.direction === "ida" ? '<span class="dir-badge dir-ida">🔴 IDA</span>' : '<span class="dir-badge dir-vuelta">🔵 VUELTA</span>';
      var devBadge = '<span class="dev-dot-sm" style="background:' + trip.deviceColor + '"></span>' + trip.deviceName;
      var devs = trip.deviationCount > 0 ? '<span style="color:#c0392b">⚠ ' + trip.deviationCount + '</span>' : '<span style="color:#27ae60">✓ 0</span>';

      return "<tr><td>" + dateStr + "</td><td>" + startStr + " – " + endStr + "</td><td>" + devBadge + "</td><td>" + dirBadge + "</td><td>" + dur + "</td><td>" +
        (trip.avgSpeedKmh > 0 ? trip.avgSpeedKmh + " km/h" : "--") + "</td><td>" + (trip.distanceKm > 0 ? trip.distanceKm + " km" : "--") + "</td><td>" + devs + "</td></tr>";
    }).join("");

    content.innerHTML =
      '<table class="history-table"><thead><tr><th>Fecha</th><th>Horario</th><th>Unidad</th><th>Dirección</th><th>Duración</th><th>Vel. media</th><th>Distancia</th><th>Desvíos</th></tr></thead><tbody>' +
      rows + "</tbody></table>";
  }

  document.getElementById("history-btn").addEventListener("click", function () {
    renderHistoryModal();
    document.getElementById("history-modal").style.display = "flex";
  });
  document.getElementById("close-history-btn").addEventListener("click", function () {
    document.getElementById("history-modal").style.display = "none";
  });
  document.getElementById("history-modal").addEventListener("click", function (e) {
    if (e.target === document.getElementById("history-modal")) document.getElementById("history-modal").style.display = "none";
  });
  document.getElementById("clear-history-btn").addEventListener("click", function () {
    if (confirm("¿Borrar todo el historial de viajes? Esta acción no se puede deshacer.")) {
      localStorage.removeItem(LS_KEY);
      renderHistoryModal();
    }
  });

  // Inicialización
  renderDeviceSelector();
  updatePanel();
  DEVICES.forEach(function (dev) {
    updateLocation(dev);
    setInterval(function () { updateLocation(dev); }, 5000);
  });
})();
