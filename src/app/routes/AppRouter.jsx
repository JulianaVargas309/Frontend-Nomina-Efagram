import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../../features/auth/pages/LoginPage';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import PrivateRoute from './PrivateRoute';
import ZonasPage from "../../features/territorial/pages/ZonasPage";
import NucleosPage from "../../features/territorial/pages/NucleosPage";
import FincasPage from "../../features/territorial/pages/FincasPage";


export default function AppRouter() {
  return (
    <Routes>

      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/territorial/zonas"
        element={
          <PrivateRoute>
            <ZonasPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/territorial/nucleos"
        element={
          <PrivateRoute>
            <NucleosPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/territorial/fincas"
        element={
          <PrivateRoute>
            <FincasPage />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
}
