// Medios de pago manual de una inscripción (puro: lo usan servidor y cliente).
export type MedioPago = "transferencia" | "factura" | "sin_costo";

export const MEDIOS_PAGO: ReadonlyArray<{ id: MedioPago; titulo: string; detalle: string }> = [
  { id: "transferencia", titulo: "Transferencia", detalle: "Recibí el dinero en mi cuenta." },
  { id: "factura", titulo: "Factura a empresa", detalle: "Se paga por factura, fuera de la plataforma." },
  { id: "sin_costo", titulo: "Sin costo", detalle: "Beca, cortesía o curso gratuito." },
];
