// Líneas de la red Vixel.
// Recorridos: geometría oficial CNRT / Min. Transporte (datos.transporte.gob.ar), recortada a CABA.
// Pasajeros: SUBE "Cantidad de transacciones (usos) por día" 2025 — datos.transporte.gob.ar.
// Coches: flota informada por Vixel.

export type Line = {
  id: string;
  color: string;
  coches: number;
  empresa: string;
  cabeceras: [string, string];
  kmCaba: number;
  duracion: string;
  horario: string;
  frecuencia: string;
  corredores: string[];
  barrios: string[];
  hitos: string[];
  sube: { habil: number; sabado: number; domingo: number; anual2025: number; mensual: number };
  semaforos: number;
  path: [number, number][]; // [lat, lng]
};

export const LINES: Line[] = [
  {
    id: "39",
    color: "#4d6bff",
    coches: 92,
    empresa: "Transportes Santa Fe S.A.C.I.",
    cabeceras: ["Barracas", "Chacarita"],
    kmCaba: 16.5,
    duracion: "55 – 80 min",
    horario: "24 h · 365 días",
    frecuencia: "2 – 4 min en el tronco Santa Fe / 9 de Julio (hora pico)",
    corredores: ["Av. 9 de Julio", "Av. Santa Fe", "Av. Córdoba", "Av. Corrientes", "Federico Lacroze"],
    barrios: ["Barracas", "San Telmo", "Constitución", "Monserrat", "San Nicolás", "Retiro", "Recoleta", "Palermo", "Colegiales", "Chacarita"],
    hitos: ["Parque Lezama", "Constitución", "Obelisco", "Teatro Colón", "Alto Palermo", "Plaza Italia", "Palermo Soho", "Estación F. Lacroze"],
    sube: { habil: 58094, sabado: 34552, domingo: 22666, anual2025: 16990193, mensual: 1415849 },
    semaforos: 110,
    path: [
      [-34.64785, -58.36809], [-34.64011, -58.36925], [-34.6308, -58.37053], [-34.62788, -58.37658], [-34.62595, -58.38225],
      [-34.61768, -58.38302], [-34.60859, -58.38345], [-34.59914, -58.38405], [-34.59586, -58.39197], [-34.59447, -58.40233],
      [-34.58839, -58.41105], [-34.58239, -58.42008], [-34.5776, -58.42806], [-34.58108, -58.43669], [-34.58455, -58.4448],
      [-34.58436, -58.45342], [-34.58694, -58.45023],
    ],
  },
  {
    id: "12",
    color: "#2ee6f5",
    coches: 79,
    empresa: "Transportes Automotores Callao S.A.",
    cabeceras: ["Puente Pueyrredón · Barracas", "Plaza Falucho · Palermo"],
    kmCaba: 12.7,
    duracion: "45 – 65 min",
    horario: "24 h · todos los días",
    frecuencia: "≈ 2 min en hora pico (ramal A)",
    corredores: ["Av. Montes de Oca", "Av. Entre Ríos", "Av. Callao", "Av. Santa Fe"],
    barrios: ["Barracas", "Constitución", "Parque Patricios", "San Cristóbal", "Balvanera", "Monserrat", "Recoleta", "Palermo"],
    hitos: ["Puente Pueyrredón", "Hospital Garrahan", "Constitución", "Congreso", "Av. Callao", "Barrio Norte", "Plaza Italia", "La Rural"],
    sube: { habil: 53646, sabado: 31332, domingo: 19289, anual2025: 15714288, mensual: 1309524 },
    semaforos: 90,
    path: [
      [-34.65558, -58.37461], [-34.65034, -58.37774], [-34.64663, -58.37311], [-34.63966, -58.37442], [-34.63324, -58.37579],
      [-34.6277, -58.37959], [-34.6271, -58.38721], [-34.62399, -58.39272], [-34.61695, -58.39319], [-34.61041, -58.39334],
      [-34.6032, -58.39399], [-34.5958, -58.39465], [-34.59447, -58.40233], [-34.58953, -58.40952], [-34.58518, -58.41594],
      [-34.58061, -58.42261], [-34.57654, -58.42937],
    ],
  },
  {
    id: "67",
    color: "#3cffc8",
    coches: 60,
    empresa: "Transportes del Tejar S.A.",
    cabeceras: ["Constitución", "Munro · Vicente López"],
    kmCaba: 18.7,
    duracion: "75 – 90 min",
    horario: "24 h · 7 días",
    frecuencia: "3 – 5 min en hora pico",
    corredores: ["Metrobús 9 de Julio", "Av. del Libertador", "Figueroa Alcorta", "Av. Santa Fe", "Metrobús Cabildo"],
    barrios: ["Constitución", "Monserrat", "San Nicolás", "Retiro", "Recoleta", "Palermo", "Colegiales", "Belgrano", "Coghlan", "Saavedra"],
    hitos: ["Constitución", "Obelisco", "Patio Bullrich", "Facultad de Derecho", "MALBA", "Bosques de Palermo", "Plaza Italia", "Cabildo y Juramento"],
    sube: { habil: 37668, sabado: 21706, domingo: 14482, anual2025: 10972840, mensual: 914403 },
    semaforos: 108,
    path: [
      [-34.6332, -58.38259], [-34.62221, -58.38296], [-34.61419, -58.38126], [-34.60316, -58.38208], [-34.59279, -58.38165],
      [-34.58584, -58.3874], [-34.58067, -58.39806], [-34.57458, -58.40759], [-34.57713, -58.41703], [-34.57812, -58.42658],
      [-34.57339, -58.43845], [-34.56786, -58.44909], [-34.5611, -58.45754], [-34.56166, -58.46769], [-34.55674, -58.47937],
      [-34.55514, -58.49239], [-34.54971, -58.50059],
    ],
  },
  {
    id: "124",
    color: "#ffb627",
    coches: 51,
    empresa: "Transportes Automotores Callao S.A.",
    cabeceras: ["Facultad de Derecho · Recoleta", "Tres de Febrero"],
    kmCaba: 21.3,
    duracion: "70 – 95 min",
    horario: "24 h · 7 días",
    frecuencia: "4 – 8 min en días hábiles",
    corredores: ["Av. Pueyrredón", "Av. Corrientes", "Av. Díaz Vélez", "Av. Gaona", "Av. Nazca", "Av. Beiró"],
    barrios: ["Recoleta", "Balvanera", "Almagro", "Caballito", "Villa Crespo", "Flores", "Villa Santa Rita", "Villa del Parque", "Monte Castro", "Villa Devoto"],
    hitos: ["Facultad de Derecho", "Centro Cultural Recoleta", "Abasto Shopping", "Plaza Miserere", "Parque Centenario", "Hospital Durand", "Villa del Parque", "Shopping Devoto"],
    sube: { habil: 28989, sabado: 17996, domingo: 9780, anual2025: 8406800, mensual: 700567 },
    semaforos: 108,
    path: [
      [-34.58421, -58.39021], [-34.58996, -58.38794], [-34.60077, -58.39143], [-34.60342, -58.40221], [-34.6061, -58.41364],
      [-34.60419, -58.42733], [-34.60586, -58.44012], [-34.61103, -58.45297], [-34.61627, -58.4657], [-34.61745, -58.47664],
      [-34.60691, -58.4852], [-34.6047, -58.49267], [-34.61198, -58.49956], [-34.61565, -58.51125], [-34.61204, -58.52194],
      [-34.61095, -58.52934],
    ],
  },
  {
    id: "102",
    color: "#ff4f8b",
    coches: 47,
    empresa: "Empresa de Transportes Sargento Cabral",
    cabeceras: ["Barracas", "Estación Lisandro de la Torre · Palermo"],
    kmCaba: 14,
    duracion: "45 – 60 min",
    horario: "24 h · 7 días",
    frecuencia: "5 – 8 min en hora pico",
    corredores: ["Av. Montes de Oca", "Av. Callao", "Av. Las Heras", "Figueroa Alcorta", "Av. del Libertador"],
    barrios: ["Barracas", "Constitución", "Monserrat", "San Nicolás", "Recoleta", "Retiro", "Palermo"],
    hitos: ["Constitución", "Tribunales", "Av. Callao", "Recoleta Mall", "Palermo Chico", "Paseo Alcorta", "Campo de Polo", "Primera flota Vixel"],
    sube: { habil: 23172, sabado: 11293, domingo: 7361, anual2025: 6607332, mensual: 550611 },
    semaforos: 73,
    path: [
      [-34.64217, -58.3706], [-34.6403, -58.37431], [-34.63442, -58.3754], [-34.62743, -58.37847], [-34.62483, -58.38718],
      [-34.61878, -58.38742], [-34.61243, -58.38751], [-34.60655, -58.38783], [-34.59932, -58.38815], [-34.59284, -58.38877],
      [-34.58923, -58.39304], [-34.58586, -58.39896], [-34.58346, -58.40525], [-34.57458, -58.40759], [-34.57496, -58.41505],
      [-34.57, -58.4255], [-34.56695, -58.4314], [-34.56397, -58.4363],
    ],
  },
];

export const LANDMARKS: { n: string; p: [number, number] }[] = [
  { n: "Obelisco", p: [-34.6037, -58.3816] },
  { n: "Plaza Italia", p: [-34.5812, -58.421] },
  { n: "Constitución", p: [-34.6277, -58.3812] },
  { n: "Congreso", p: [-34.6098, -58.3926] },
  { n: "Abasto", p: [-34.6037, -58.4108] },
  { n: "Fac. Derecho", p: [-34.5833, -58.3915] },
  { n: "Parque Centenario", p: [-34.6064, -58.4357] },
  { n: "Chacarita", p: [-34.5872, -58.4547] },
  { n: "Belgrano", p: [-34.5627, -58.4565] },
  { n: "Devoto", p: [-34.6012, -58.5133] },
  { n: "Barracas", p: [-34.6455, -58.3705] },
];

export const TOTAL_COCHES = LINES.reduce((a, l) => a + l.coches, 0);
export const TOTAL_SUBE_HABIL = LINES.reduce((a, l) => a + l.sube.habil, 0);
export const TOTAL_SUBE_ANUAL = LINES.reduce((a, l) => a + l.sube.anual2025, 0);
export const TOTAL_SEMAFOROS = LINES.reduce((a, l) => a + l.semaforos, 0);

// Contexto AMBA — GCBA Observatorio de Movilidad (OMSV), informe agosto 2026, promedio día hábil.
export const CITY = {
  colectivosAmbaDia: 7697975,
  colectivosCabaDia: 2480880,
  busesCalle9am: 7198,
  vehiculosDia: 1800000,
  congestion: 48.8,
  semaforosCaba: 3802,
};
