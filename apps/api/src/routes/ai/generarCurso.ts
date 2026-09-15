import { Router } from "express";
import { generarCursoDesdeMaterial } from "../../lib/ai/generarCurso.js";

export const generarCursoRouter = Router();

generarCursoRouter.post("/", async (req, res) => {
  const tenant = req.tenant;
  const { materialCrudo } = req.body as { materialCrudo?: string };

  if (!tenant) {
    return res.status(400).json({ error: "No se pudo determinar el tenant" });
  }

  if (!materialCrudo) {
    return res.status(400).json({ error: "Falta materialCrudo en el body" });
  }

  try {
    const curso = await generarCursoDesdeMaterial({
      tenantId: tenant.id,
      materialCrudo,
    });
    res.json(curso);
  } catch (err) {
    res.status(500).json({ error: "No se pudo generar el curso" });
  }
});
