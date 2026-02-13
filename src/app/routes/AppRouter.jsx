import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../../features/auth/pages/LoginPage';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import PrivateRoute from './PrivateRoute';
import ZonasPage from "../../features/territorial/pages/ZonasPage";
import ProyectosPage from "../../features/proyectos/pages/ProyectosPage";
import ClientesPage from "../../features/proyectos/pages/ClientesPage";
import CatalogoActividadesPage from "../../features/proyectos/pages/CatalogoActividadesPage";
import PreciosPage from "../../features/proyectos/pages/PreciosPage";



export default function AppRouter() {
  return (
    <Routes>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/proyectos" element={<ProyectosPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
      <Route path="/territorial/zonas" element={<ZonasPage />} />


    </Routes>
  );
}
