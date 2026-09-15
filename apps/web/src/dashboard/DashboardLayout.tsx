import { Link, Outlet } from "react-router-dom";

export function DashboardLayout() {
  return (
    <div>
      <nav>
        <Link to="/">Resumen</Link>
        <Link to="/cursos">Cursos</Link>
        <Link to="/estudiantes">Estudiantes</Link>
        <Link to="/configuracion/dominio">Dominio</Link>
        <Link to="/configuracion/marca">Marca</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
