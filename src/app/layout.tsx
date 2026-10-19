import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk, Doto } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const doto = Doto({ variable: "--font-doto", subsets: ["latin"], weight: ["700", "900"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://vixel.com.ar"),
  title: "Vixel — La ciudad es la pantalla · Publicidad LED en colectivos de CABA",
  description:
    "Red de pantallas LED de alto brillo en la luneta trasera de colectivos de Buenos Aires. Líneas 12, 39, 67, 102 y 124. Publicidad digital geolocalizada, en tiempo real. Además, tótems y pantallas para shoppings, pisos LED, fachadas y eventos.",
  keywords: [
    "publicidad en colectivos",
    "pantallas LED",
    "luneta LED",
    "DOOH Buenos Aires",
    "publicidad CABA",
    "tótems shopping",
    "Vixel",
  ],
  openGraph: {
    title: "Vixel — La ciudad es la pantalla",
    description: "Publicidad digital en movimiento: pantallas LED en colectivos de CABA.",
    locale: "es_AR",
    type: "website",
    images: ["/img/bus-night.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#232323",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${geist.variable} ${geistMono.variable} ${display.variable} ${doto.variable} antialiased`}
    >
      <body>
        {children}
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
