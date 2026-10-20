// Auth contra el backend Django + SimpleJWT (api.vixel.com.ar). Es stateless:
// el token va en el header Authorization de cada request. Mismas claves de
// localStorage que el backoffice anterior, así una sesión abierta sigue valiendo.
//
// Las rutas se piden relativas (/api/...) y next.config.ts las reescribe al
// backend. Se les saca la barra final porque Next redirige las URLs con barra
// (308) antes de reescribir; el rewrite se la vuelve a poner para Django.

const ACCESS_KEY = "vixel_access_token";
const REFRESH_KEY = "vixel_refresh_token";

export type Perfil = { username: string; rol: string };

function apiUrl(path: string) {
  return path.replace(/\/+$/, "");
}

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

function setTokens(access: string, refresh?: string | null) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// Lee "exp" del JWT sin golpear la red. No es una verificación de seguridad
// (eso lo hace el backend), es para no entrar a una página con un token vencido.
export function isExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return !payload.exp || Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function goToLogin() {
  location.href = "/login?volver=" + encodeURIComponent(location.pathname);
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;
  try {
    const resp = await fetch(apiUrl("/api/auth/refresh/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    setTokens(data.access, null);
    return data.access as string;
  } catch {
    return null;
  }
}

// fetch() con el Bearer token; si da 401 reintenta una vez con refresh.
export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  const token = getAccessToken();
  if (token) headers.Authorization = "Bearer " + token;
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  let resp = await fetch(apiUrl(path), { ...options, headers });

  if (resp.status === 401) {
    const nuevo = await refreshAccessToken();
    if (nuevo) {
      headers.Authorization = "Bearer " + nuevo;
      resp = await fetch(apiUrl(path), { ...options, headers });
    } else {
      clearTokens();
      goToLogin();
    }
  }
  return resp;
}

export async function login(username: string, password: string) {
  const resp = await fetch(apiUrl("/api/auth/login/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!resp.ok) throw new Error("Usuario o contraseña incorrectos.");
  const data = await resp.json();
  setTokens(data.access, data.refresh);
  return data;
}

export function logout() {
  clearTokens();
  location.href = "/login";
}

// Saca un mensaje legible de una respuesta de error de DRF.
export async function errorMessage(resp: Response) {
  const err = await resp.json().catch(() => ({}));
  if (err.detail) return String(err.detail);
  const first = Object.entries(err)[0];
  if (first) return `${first[0]}: ${Array.isArray(first[1]) ? first[1].join(" ") : String(first[1])}`;
  return "Error " + resp.status;
}
