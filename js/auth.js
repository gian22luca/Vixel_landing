// Helper de autenticacion compartido por /login/, /panel/ y /config/.
// El backend (Django + SimpleJWT) es stateless: no hay cookies de sesion,
// el token va en el header Authorization de cada request.
var VIXEL_API_BASE = "https://api.vixel.com.ar";

var VixelAuth = (function () {
  var ACCESS_KEY = "vixel_access_token";
  var REFRESH_KEY = "vixel_refresh_token";

  function getAccessToken() {
    return localStorage.getItem(ACCESS_KEY);
  }

  function setTokens(access, refresh) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  }

  function clearTokens() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  // Decodifica el payload del JWT para leer "exp" sin golpear la red.
  // No es una verificacion de seguridad (eso lo hace el backend en cada
  // request) - es solo para no mandar a nadie a una pagina protegida con
  // un token que ya sabemos vencido.
  function isExpired(token) {
    try {
      var payload = JSON.parse(atob(token.split(".")[1]));
      return !payload.exp || Date.now() >= payload.exp * 1000;
    } catch (e) {
      return true;
    }
  }

  // Llama a una pagina protegida (panel, config) apenas carga el script.
  // Si no hay token valido, redirige a /login/ guardando a donde volver.
  function requireAuth() {
    var token = getAccessToken();
    if (!token || isExpired(token)) {
      clearTokens();
      var volver = encodeURIComponent(location.pathname);
      location.href = "/login/?volver=" + volver;
      return null;
    }
    return token;
  }

  async function refreshAccessToken() {
    var refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) return null;
    try {
      var resp = await fetch(VIXEL_API_BASE + "/api/auth/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refresh }),
      });
      if (!resp.ok) return null;
      var data = await resp.json();
      setTokens(data.access, null);
      return data.access;
    } catch (e) {
      return null;
    }
  }

  // Wrapper de fetch() que agrega el Bearer token y reintenta una vez con
  // refresh si el access token vencio (401).
  async function apiFetch(path, options) {
    options = options || {};
    options.headers = Object.assign({}, options.headers);

    var token = getAccessToken();
    if (token) options.headers["Authorization"] = "Bearer " + token;
    if (options.body && !options.headers["Content-Type"]) {
      options.headers["Content-Type"] = "application/json";
    }

    var resp = await fetch(VIXEL_API_BASE + path, options);

    if (resp.status === 401) {
      var nuevoToken = await refreshAccessToken();
      if (nuevoToken) {
        options.headers["Authorization"] = "Bearer " + nuevoToken;
        resp = await fetch(VIXEL_API_BASE + path, options);
      } else {
        clearTokens();
        location.href = "/login/?volver=" + encodeURIComponent(location.pathname);
        return resp;
      }
    }

    return resp;
  }

  async function login(username, password) {
    var resp = await fetch(VIXEL_API_BASE + "/api/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password }),
    });
    if (!resp.ok) {
      var err = new Error("Usuario o contraseña incorrectos.");
      err.status = resp.status;
      throw err;
    }
    var data = await resp.json();
    setTokens(data.access, data.refresh);
    return data;
  }

  function logout() {
    clearTokens();
    location.href = "/login/";
  }

  return {
    requireAuth: requireAuth,
    apiFetch: apiFetch,
    login: login,
    logout: logout,
    getAccessToken: getAccessToken,
  };
})();
