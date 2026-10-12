import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import "./creador.css";

interface FieldProps {
  id: string;
  label: string;
  opcional?: boolean;
  ayuda?: string;
  error?: string | null;
  /** Ej. "12/80". */
  contador?: string;
  children: ReactNode;
}

/** Etiqueta + control + ayuda/error. El control debe usar el mismo `id`. */
export function Field({ id, label, opcional, ayuda, error, contador, children }: FieldProps) {
  return (
    <div className="cr-field">
      <label className="cr-field__label" htmlFor={id}>
        {label}
        {opcional && <span className="cr-field__opt">(opcional)</span>}
      </label>
      {ayuda && (
        <span className="cr-field__hint" id={`${id}-ayuda`}>
          {ayuda}
        </span>
      )}
      {children}
      {error && (
        <span className="cr-field__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
      {contador && <span className="cr-field__counter">{contador}</span>}
    </div>
  );
}

function aria(id: string, error?: boolean, ayuda?: boolean) {
  const ids = [ayuda ? `${id}-ayuda` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return { "aria-invalid": error ? true : undefined, "aria-describedby": ids || undefined } as const;
}

type Extra = { id: string; invalido?: boolean; conAyuda?: boolean };

export function Input({ id, invalido, conAyuda, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & Extra) {
  return <input id={id} className={`av-input cr-input ${className ?? ""}`} {...aria(id, invalido, conAyuda)} {...rest} />;
}

export function Textarea({ id, invalido, conAyuda, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & Extra) {
  return <textarea id={id} className={`av-input cr-input ${className ?? ""}`} {...aria(id, invalido, conAyuda)} {...rest} />;
}

export function Select({ id, invalido, conAyuda, className, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & Extra) {
  return <select id={id} className={`av-input cr-input ${className ?? ""}`} {...aria(id, invalido, conAyuda)} {...rest} />;
}
