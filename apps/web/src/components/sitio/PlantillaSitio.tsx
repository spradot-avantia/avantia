// Elige el template de la página de la academia (Programa, Maestro o Consultor).
import type { DatosSitio } from "../../lib/sitio/tipos";
import { TemplateConsultor } from "./TemplateConsultor";
import { TemplateMaestro } from "./TemplateMaestro";
import { TemplatePrograma } from "./TemplatePrograma";
import "./sitio.css";

export function PlantillaSitio({ d }: { d: DatosSitio }) {
  return (
    <div className={`st${d.modo === "vista" ? " st--vista" : ""}`}>
      {d.template === "maestro" ? (
        <TemplateMaestro d={d} />
      ) : d.template === "consultor" ? (
        <TemplateConsultor d={d} />
      ) : (
        <TemplatePrograma d={d} />
      )}
    </div>
  );
}