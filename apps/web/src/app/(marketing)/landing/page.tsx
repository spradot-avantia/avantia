import type { Metadata } from "next";
import Landing from "@/components/marketing/Landing";

export const metadata: Metadata = {
  title: "Avantia | Tu academia online, con tu marca",
  description:
    "Sube tus cursos, recibe los pagos de tus alumnos y entrégales una experiencia con tu marca. Programa fundador: 5 cupos, 30 días gratis, sin tarjeta.",
};

export default function LandingPage() {
  return <Landing />;
}