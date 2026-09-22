import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./dashboard.module.css";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Avantia</div>
        <nav className={styles.nav}>
          <Link className={styles.navLink} href="/">
            Resumen
          </Link>
          <Link className={styles.navLink} href="/cursos">
            Cursos
          </Link>
          <Link className={styles.navLink} href="/estudiantes">
            Estudiantes
          </Link>
          <Link className={styles.navLink} href="/configuracion/dominio">
            Dominio
          </Link>
          <Link className={styles.navLink} href="/configuracion/marca">
            Marca
          </Link>
        </nav>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
