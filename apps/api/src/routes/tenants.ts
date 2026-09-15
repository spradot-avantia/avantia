import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase/admin.js";

export const tenantsRouter = Router();

// GET /api/tenants/resolve?hostname=academiadejuan.com
// Lo consume el frontend público (SPA) al cargar, para saber qué academia
// mostrar según window.location.hostname.
tenantsRouter.get("/resolve", async (req, res) => {
  const hostname = String(req.query.hostname ?? "");

  if (!hostname) {
    return res.status(400).json({ error: "Falta el parámetro hostname" });
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id, slug, nombre, logo_url, color_primario")
    .or(`custom_domain.eq.${hostname},subdomain.eq.${hostname.split(".")[0]}`)
    .maybeSingle();

  if (error || !data) {
    return res.status(404).json({ error: "Academia no encontrada" });
  }

  res.json(data);
});

// POST /api/tenants -> alta de un nuevo tenant (nueva academia).
tenantsRouter.post("/", async (req, res) => {
  const { nombre, subdomain } = req.body as {
    nombre?: string;
    subdomain?: string;
  };

  if (!nombre || !subdomain) {
    return res.status(400).json({ error: "Faltan nombre o subdomain" });
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .insert({ nombre, subdomain })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: "No se pudo crear el tenant" });
  }

  res.status(201).json(data);
});
