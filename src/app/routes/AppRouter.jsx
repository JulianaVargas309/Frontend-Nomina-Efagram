import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage     from '../../features/auth/pages/LoginPage';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import PrivateRoute  from './PrivateRoute';

// Territorial
import ZonasPage   from '../../features/territorial/pages/ZonasPage';
import NucleosPage from '../../features/territorial/pages/NucleosPage';
import FincasPage  from '../../features/territorial/pages/FincasPage';

// Ejecución
import RegistroDiarioPage    from '../../features/ejecucion/pages/RegistroDiarioPage';
import NovedadesPage         from '../../features/ejecucion/pages/NovedadesPage';
import CalendarioPage        from '../../features/ejecucion/pages/CalendarioPage';
import SemanasOperativasPage from '../../features/ejecucion/pages/SemanasOperativasPage';

// Proyectos
import ProyectosPage          from '../../features/proyectos/pages/ProyectosPage';
import ClientesPage           from '../../features/proyectos/pages/ClientesPage';
import CatalogoActividadesPage from '../../features/proyectos/pages/CatalogoActividadesPage';
// PreciosPage eliminado

export default function AppRouter() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Dashboard */}
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

      {/* ── Territorial ── */}
      <Route path="/territorial/zonas"   element={<PrivateRoute><ZonasPage /></PrivateRoute>} />
      <Route path="/territorial/nucleos" element={<PrivateRoute><NucleosPage /></PrivateRoute>} />
      <Route path="/territorial/fincas"  element={<PrivateRoute><FincasPage /></PrivateRoute>} />

      {/* ── Ejecución ── */}
      <Route path="/ejecucion/registros-diarios"   element={<PrivateRoute><RegistroDiarioPage /></PrivateRoute>} />
      <Route path="/ejecucion/novedades"           element={<PrivateRoute><NovedadesPage /></PrivateRoute>} />
      <Route path="/ejecucion/calendario"          element={<PrivateRoute><CalendarioPage /></PrivateRoute>} />
      <Route path="/ejecucion/semanas-operativas"  element={<PrivateRoute><SemanasOperativasPage /></PrivateRoute>} />

      {/* ── Proyectos ── */}
      <Route path="/proyectos"            element={<PrivateRoute><ProyectosPage /></PrivateRoute>} />
      <Route path="/clientes"             element={<PrivateRoute><ClientesPage /></PrivateRoute>} />
      <Route path="/catalogo-actividades" element={<PrivateRoute><CatalogoActividadesPage /></PrivateRoute>} />
      {/* /precios eliminado */}

      {/* Wildcard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}