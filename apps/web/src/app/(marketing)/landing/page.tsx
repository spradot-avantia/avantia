import type { Metadata } from "next";
import Landing from "@/components/marketing/Landing";

export const metadata: Metadata = {
  title: "Avantia Plataforma",
  description:
    "Avantia ayuda a expertos de la industria a convertir su experiencia en cursos prácticos. Crea, publica y enseña desde un solo lugar.",
};

export default function LandingPage() {
  return <Landing />;
}