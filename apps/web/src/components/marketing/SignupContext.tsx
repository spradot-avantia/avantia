"use client";

import { createContext, useContext, useState, type ReactNode, type RefObject } from "react";

// El formulario del hero y el del final comparten el correo:
// el del hero lo precarga en el formulario final y le pasa el foco al nombre.

type SignupState = {
  email: string;
  setEmail: (v: string) => void;
};


const SignupContext = createContext<SignupState | null>(null);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  return <SignupContext.Provider value={{ email, setEmail }}>{children}</SignupContext.Provider>;
}

export function useSignup() {
  const ctx = useContext(SignupContext);
  if (!ctx) throw new Error("useSignup debe usarse dentro de <SignupProvider>");
  return ctx;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";