import './header.css';
import { useAuth } from "../../app/providers/useAuth";
import { Menu } from "lucide-react";

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

export default function Header({ onMenuClick }) {
  const { user } = useAuth();
  const displayName = getDisplayName(user);

  return (
    <header className="dashboard-header">
      <div className="header-left">
        {/* Botón hamburguesa — solo visible en móvil vía CSS */}
        <button
          className="hamburger-btn"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <h2>Dashboard</h2>
      </div>
      <div>
        Bienvenido(a), <strong>{displayName}</strong>
      </div>
    </header>
  );
}