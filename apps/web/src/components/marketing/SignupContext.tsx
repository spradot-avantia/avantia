"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ApplySheet } from "./ApplySheet";

// Estado compartido de la landing: el correo capturado en el hero / sección final
// precarga el formulario de postulación (sheet), que se abre desde cualquier CTA.

type SignupState = {
  email: string;
  setEmail: (v: string) => void;
  fromEmail: boolean;
  openSheet: (fromEmail?: boolean) => void;
  closeSheet: () => void;
};

const SignupContext = createContext<SignupState | null>(null);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fromEmail, setFromEmail] = useState(false);

  const openSheet = useCallback((fromEmail = false) => {
    setFromEmail(fromEmail);
    setSheetOpen(true);
  }, []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  return (
    <SignupContext.Provider value={{ email, setEmail, fromEmail, openSheet, closeSheet }}>
      {children}
      {sheetOpen && <ApplySheet />}
    </SignupContext.Provider>
  );
}

export function useSignup() {
  const ctx = useContext(SignupContext);
  if (!ctx) throw new Error("useSignup debe usarse dentro de <SignupProvider>");
  return ctx;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
