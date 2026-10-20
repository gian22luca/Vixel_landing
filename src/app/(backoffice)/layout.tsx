import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "../backoffice.css";
import Shell from "@/components/backoffice/Shell";

export const metadata: Metadata = {
  title: "Panel — Vixel",
  robots: { index: false, follow: false },
};

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
