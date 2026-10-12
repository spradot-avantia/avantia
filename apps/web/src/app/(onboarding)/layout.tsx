import type { ReactNode } from "react";
import "../../components/creador/creador.css";

// Layout minimo sin menu lateral para el onboarding de primera vez.
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="av-scope" style={{ minHeight: "100vh", padding: "var(--av-space-5) var(--av-gutter)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>{children}</div>
    </div>
  );
}
