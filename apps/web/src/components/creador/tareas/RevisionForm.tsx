"use client";

// Formulario de revisión de una entrega (ADR 038): puntaje, comentario («dónde mejorar») y
// publicación. Guardar sin publicar deja un borrador que el alumno no ve.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { guardarRevisionAction } from "../../../lib/creador/actionsTareas";
import { formatearPuntaje } from "../../../lib/tareas/reglas";
import { Button } from "../Button";
import { Field, Input, Textarea } from "../Field";
import "./tareas.css";

export function RevisionForm({
  entregaId,
  puntajeMaximo,
  inicial,
}: {
  entregaId: string;
  puntajeMaximo: number;
  inicial: { puntaje: number; comentario: string; publicada: boolean } | null;
}) {
  const uid = useId();
  const router = useRouter();
  const [puntaje, setPuntaje] = useState(inicial ? formatearPuntaje(inicial.puntaje) : "");
  const [comentario, setComentario] = useState(inicial?.comentario ?? "");
  const [publicada, setPublicada] = useState(!!inicial?.publicada);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ texto: string; error?: boolean } | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  async function enviar(publicar: boolean) {
    setTrabajando(true);
    setMsg(null);
    const r = await guardarRevisionAction(entregaId, { puntaje, comentario }, publicar);
    setTrabajando(false);
    if (!r.ok) {
      setErrores(r.campos ?? {});
      setMsg({ texto: r.error, error: true });
      return;
    }
    setErrores({});
    setPublicada(r.data.publicada);
    setMsg({ texto: r.data.publicada ? "Revisión publicada: el alumno ya puede verla." : "Borrador guardado. El alumno aún no lo ve." });
    router.refresh();
  }

  return (
    <div className="tr-box">
      <Field id={`${uid}-p`} label={`Puntaje (máximo ${formatearPuntaje(puntajeMaximo)})`} error={errores.puntaje}>
        <Input id={`${uid}-p`} inputMode="decimal" value={puntaje} invalido={!!errores.puntaje} onChange={(e) => setPuntaje(e.target.value)} />
      </Field>
      <Field id={`${uid}-c`} label="Comentarios: qué hizo bien y dónde mejorar" opcional error={errores.comentario}>
        <Textarea
          id={`${uid}-c`}
          className="tr-textarea"
          value={comentario}
          invalido={!!errores.comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={8}
        />
      </Field>
      <div className="tr-actions">
        <Button onClick={() => enviar(true)} disabled={trabajando}>
          {publicada ? "Guardar cambios" : "Publicar al alumno"}
        </Button>
        {!publicada && (
          <Button variante="secondary" onClick={() => enviar(false)} disabled={trabajando}>
            Guardar borrador
          </Button>
        )}
        <Link href="/revisiones" className="tr-hint">
          Volver a la lista
        </Link>
      </div>
      <p className={`tr-status${msg?.error ? " tr-status--error" : ""}`} role={msg?.error ? "alert" : "status"}>
        {msg?.texto ?? (publicada ? "Esta revisión ya está publicada." : "Todavía no es visible para el alumno.")}
      </p>
    </div>
  );
}
