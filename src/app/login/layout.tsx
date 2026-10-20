import type { Metadata } from "next";
import "../backoffice.css";

export const metadata: Metadata = {
  title: "Ingresar — Vixel",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
