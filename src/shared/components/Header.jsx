import './header.css';
import { useAuth } from "../../app/providers/useAuth";

function getDisplayName(user) {
  if (!user) return 'Usuario';

  const fullName = `${user?.nombres ?? ''} ${user?.apellidos ?? ''}`.trim();

  return (
    user?.nombreCompleto ||
    user?.nombre_completo ||
    fullName ||
    user?.nombre ||
    user?.name ||
    user?.username ||
    user?.email ||
    'Usuario'
  );
}

export default function Header() {
  const { user } = useAuth();
  const displayName = getDisplayName(user);

  return (
    <header className="dashboard-header">
      <h2>Dashboard</h2>
      <div>
        Bienvenido(a), <strong>{displayName}</strong>
      </div>
    </header>
  );
}