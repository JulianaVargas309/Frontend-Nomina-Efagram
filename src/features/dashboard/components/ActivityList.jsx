import { Play, Users, CalendarDays, Folder, MapPin, FileText, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

function getActivityArray(activities) {
  return Array.isArray(activities) ? activities : [];
}

function getActivityText(item) {
  return (
    item?.titulo ||
    item?.title ||
    item?.descripcion ||
    item?.description ||
    item?.mensaje ||
    item?.message ||
    item?.accion ||
    item?.actividad ||
    'Actividad reciente'
  );
}

function getActivityDate(item) {
  return (
    item?.fecha ||
    item?.createdAt ||
    item?.updatedAt ||
    item?.timestamp ||
    item?.hora ||
    null
  );
}

function getActivityModule(item) {
  return (
    item?.modulo ||
    item?.module ||
    item?.tipo ||
    item?.type ||
    ''
  )
    .toString()
    .toLowerCase()
    .trim();
}

function getActivityRoute(item) {
  const modulo = getActivityModule(item);
  const texto = getActivityText(item).toLowerCase();

  if (modulo.includes('programacion') || texto.includes('registro') || texto.includes('ejecución')) {
    return '/programacion';
  }

  if (modulo.includes('reporte') || texto.includes('reporte')) {
    return '/reportes';
  }

  if (modulo.includes('personal') || texto.includes('personal')) {
    return '/personal/catalogo';
  }

  if (modulo.includes('proyecto') || texto.includes('proyecto') || texto.includes('subproyecto')) {
    return '/proyectos';
  }

  if (modulo.includes('territorial') || texto.includes('zona') || texto.includes('finca') || texto.includes('núcleo') || texto.includes('nucleo')) {
    return '/territorial/zonas';
  }

  if (modulo.includes('novedad') || texto.includes('novedad')) {
    return '/ejecucion/novedades';
  }

  return null;
}

function getActivityIcon(item) {
  const modulo = getActivityModule(item);
  const texto = getActivityText(item).toLowerCase();

  if (modulo.includes('programacion') || texto.includes('registro') || texto.includes('ejecución')) {
    return Play;
  }

  if (modulo.includes('reporte') || texto.includes('reporte') || texto.includes('semana')) {
    return CalendarDays;
  }

  if (modulo.includes('personal') || texto.includes('personal') || texto.includes('trabajador')) {
    return Users;
  }

  if (modulo.includes('proyecto') || texto.includes('proyecto') || texto.includes('subproyecto')) {
    return Folder;
  }

  if (modulo.includes('territorial') || texto.includes('zona') || texto.includes('finca')) {
    return MapPin;
  }

  if (modulo.includes('novedad') || texto.includes('novedad')) {
    return Bell;
  }

  return FileText;
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return 'Reciente';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return 'Reciente';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'Hace un momento';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `Hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;

  const diffYears = Math.floor(diffMonths / 12);
  return `Hace ${diffYears} año${diffYears > 1 ? 's' : ''}`;
}

export default function ActivityList({ activities = [], loading = false }) {
  const navigate = useNavigate();
  const items = getActivityArray(activities).slice(0, 6);

  return (
    <div className="card-box">
      <h3>Actividad Reciente</h3>

      {loading ? (
        <div style={{ padding: "8px 0", color: "#6b7280", fontSize: "14px" }}>
          Cargando actividad reciente...
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: "8px 0", color: "#6b7280", fontSize: "14px" }}>
          Aún no hay actividad reciente registrada.
        </div>
      ) : (
        items.map((item, index) => {
          const Icon = getActivityIcon(item);
          const route = getActivityRoute(item);
          const text = getActivityText(item);
          const time = formatRelativeTime(getActivityDate(item));

          return (
            <div
              key={item?._id || item?.id || `${text}-${index}`}
              className="activity-item"
              onClick={() => route && navigate(route)}
              style={{ cursor: route ? "pointer" : "default" }}
              title={route ? "Ver módulo relacionado" : text}
            >
              <div className="activity-left">
                <div className="activity-icon">
                  <Icon size={16} />
                </div>
                <span>{text}</span>
              </div>

              <span className="activity-time">{time}</span>
            </div>
          );
        })
      )}
    </div>
  );
}