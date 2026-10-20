// Datos comerciales — fuente: Presentación Comercial Vixel CABA 2026 y fichas técnicas.

export const CONTACT = {
  email: "led.vixel@gmail.com",
  people: [
    { name: "Nicolás Ruiz", phone: "+54 9 11 3043-0514", wa: "5491130430514" },
    { name: "Gian Luca Lofeudo", phone: "+54 9 11 3830-4297", wa: "5491138304297" },
  ],
  city: "Buenos Aires, Argentina",
};

export const waLink = (msg = "Hola Vixel, quiero pautar en las pantallas LED de colectivos") =>
  `https://wa.me/${CONTACT.people[0].wa}?text=${encodeURIComponent(msg)}`;

// Mostrar u ocultar precios públicos en la web.
export const SHOW_PRICES = true;

// Modelo de audiencia por pantalla (escenario base de la presentación comercial).
export const AUDIENCE = {
  kmPerDay: 250,
  peoplePerKm: { conservador: 100, base: 140, optimista: 180 },
  daysPerMonth: 30,
  shareOfLoop: 1 / 6,
  loopSeconds: 90,
  slotSeconds: 15,
  hoursPerDay: 18,
  appearancesPerHour: 40,
  appearancesPerDay: 720,
  appearancesPerMonth: 21600,
};

export const SPECS = [
  { k: "Tecnología", v: "LED SMD · pixel pitch P4" },
  { k: "Resolución", v: "400 × 160 px" },
  { k: "Superficie", v: "1,60 × 0,64 m · 1,02 m²" },
  { k: "Brillo", v: "5.500 nits · autorregulado" },
  { k: "Visión óptima", v: "desde 4 m" },
  { k: "Formatos", v: "MP4 · MOV · JPG · PNG · GIF" },
  { k: "Spot", v: "15 segundos" },
  { k: "Emisión", v: "06:00 a 24:00 · 18 h/día" },
  { k: "Conectividad", v: "4G + GPS a bordo" },
  { k: "Alimentación", v: "12 V del vehículo" },
];

export const FRANJAS = [
  { id: "morning", name: "Morning Rush", hours: "06–10", h: 4, idx: [1.35, 0.9, 0.55], price: 90000, apar: 4800 },
  { id: "midday", name: "Midday", hours: "10–16", h: 6, idx: [0.85, 1.2, 1.0], price: 85000, apar: 7200 },
  { id: "evening", name: "Evening Rush", hours: "16–21", h: 5, idx: [1.45, 1.15, 0.95], price: 120000, apar: 6000 },
  { id: "night", name: "Night", hours: "21–24", h: 3, idx: [0.6, 0.95, 0.7], price: 30000, apar: 3600 },
] as const;

export const DAYS = ["Lun a Vie", "Sábados", "Domingos"];

export const PACKAGES = [
  {
    name: "Starter",
    screens: 5,
    price: 1500000,
    impacts: 875000,
    apar: 108000,
    perks: ["Reporte mensual estándar", "Loop de 90″ con exclusividad por pantalla", "Alta en 48 h"],
  },
  {
    name: "Growth",
    screens: 10,
    price: 3000000,
    impacts: 1750000,
    apar: 216000,
    featured: true,
    perks: ["Producción de pieza bonificada", "Elección de corredor", "Reporte de emisión + mapa GPS"],
  },
  {
    name: "Prime",
    screens: 20,
    price: 6000000,
    impacts: 3500000,
    apar: 432000,
    perks: ["Producción bonificada", "Geofencing + reportes GPS", "Creatividad por barrio o franja"],
  },
  {
    name: "Total City",
    screens: 30,
    price: 9000000,
    impacts: 5250000,
    apar: 648000,
    perks: ["Todo lo anterior", "Exclusividad de categoría en la red", "Red completa · etapa 1"],
  },
];

export const PERMANENCIA = [
  { m: "1 mes", d: 0, p: 300000 },
  { m: "3 meses", d: 5, p: 285000 },
  { m: "6 meses", d: 10, p: 270000 },
  { m: "12 meses", d: 15, p: 255000 },
];

export const COMPARE = {
  cols: ["Vixel", "Luneta LED competencia", "Luneta vinilo", "Cartel fijo", "Digital online"],
  rows: [
    { a: "Superficie", v: ["1,02 m² · 400×160", "0,77 m² · 400×120", "Luneta completa", "Variable", "—"] },
    { a: "Movilidad", v: ["250 km/día", "Sí", "Sí", "Nula", "—"] },
    { a: "Cambio de pieza", v: ["Minutos, online", "Online", "Reimpresión", "Reimpresión", "Inmediato"] },
    { a: "Segmentación horaria", v: ["4 franjas", "Parcial", "No", "No", "Sí"] },
    { a: "Geolocalización", v: ["GPS · geofencing", "Trazabilidad", "No", "Fija", "IP / GPS"] },
    { a: "Reporte de emisión", v: ["Certificado + mapa", "Monitoreo", "Foto", "Foto", "Dashboard"] },
    { a: "Evitable por el público", v: ["No", "No", "No", "No", "Adblock / skip"] },
    { a: "Movimiento en la pieza", v: ["Video", "Video", "Estático", "Estático", "Video"] },
  ],
};

export const MARKET = [
  { n: "314%", l: "Crecimiento del DOOH en Argentina durante 2024" },
  { n: "18,4%", l: "CAGR del mercado OOH + DOOH 2025 → 2030 (USD 75,1M a 174,5M)" },
  { n: "12,9%", l: "Share de la vía pública en la torta publicitaria — 3.er medio del país" },
  { n: "5,4M", l: "Pasajeros por día en colectivos del AMBA" },
];

export const SOLUTIONS = [
  {
    tag: "Shopping & Retail",
    title: "Tótems que venden",
    text: "Tótems publicitarios, pantallas ultradelgadas detrás de cajas y formatos curvos a medida para shoppings, locales y pasillos.",
    img: "/img/shopping-totems.jpg",
  },
  {
    tag: "Galerías",
    title: "Accesos que se ven",
    text: "Marcos LED y portales de entrada que convierten un acceso en un punto de atracción, de día y de noche.",
    img: "/img/galerias-pacifico.jpg",
  },
  {
    tag: "Fachadas & Outdoor",
    title: "Gran formato urbano",
    text: "Marquesinas, monopostes y pantallas curvas de alto brillo para la vía pública. Legibles a pleno sol.",
    img: "/img/fachada-astral.jpg",
  },
  {
    tag: "Vidrieras",
    title: "Vidrieras transparentes",
    text: "Pantallas transparentes e interiores para locales: la vidriera pasa a ser un medio que se programa.",
    img: "/img/vidriera.jpg",
  },
  {
    tag: "Pisos LED",
    title: "Pantallas que se pisan",
    text: "Módulos GOB encapsulados en resina, interactivos con sensores de movimiento. Para halls, eventos y lanzamientos.",
    img: "/img/evento-escenario.jpg",
  },
  {
    tag: "Eventos & Rental",
    title: "Escenarios a medida",
    text: "Pantallas modulares que se arman y desarman para shows, ferias, actos y congresos.",
    img: "/img/evento-show.jpg",
  },
  {
    tag: "Indoor",
    title: "Retail interior",
    text: "Pantallas para locales, oficinas y auditorios con contenido programable en remoto.",
    img: "/img/retail.jpg",
  },
];

export const FLEET_PRODUCTS = [
  {
    n: "01",
    title: "Cartel frontal",
    text: "Línea, destino y recorrido en full color, visible incluso de día. Programable por WiFi, USB o cable.",
    spec: "P4 · 400×80 px · 158×30×6 cm",
    img: "/img/frontal.jpg",
  },
  {
    n: "02",
    title: "Ramalera",
    text: "Refuerza el destino en la parada desde el parabrisas. Mismo estándar LED full color.",
    spec: "128×32 px · 68×20×4 cm",
    img: "/img/ramalera-102.jpg",
    pos: "center 62%",
  },
  {
    n: "03",
    title: "Tablero de comando",
    text: "Pantallas, luces interiores y calefacción desde un único panel de acero inoxidable con relés de respaldo.",
    spec: "Acero inoxidable · pulsadores reemplazables",
    img: "/img/tablero.jpg",
  },
  {
    n: "04",
    title: "Servicio técnico",
    text: "Reparamos arriba del colectivo, sin desmontar ni sacarlo de servicio. También carteles tradicionales PCB.",
    spec: "Líneas 12 · 39 · 67 · 68 · 102 · 124",
    img: "/img/led-12.jpg",
  },
];

export const fmt = (n: number) => n.toLocaleString("es-AR");
export const money = (n: number) => "$" + n.toLocaleString("es-AR");
export const compact = (n: number) =>
  n >= 1e6 ? (n / 1e6).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(n);
