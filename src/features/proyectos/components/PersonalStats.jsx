import { Users, CheckCircle, XCircle } from 'lucide-react';

export default function PersonalStats({ personal = [] }) {
  const total     = personal.length;
  const activos   = personal.filter((p) => p?.estado === 'ACTIVO').length;
  const inactivos = total - activos;

  return (
    <div className="territorial-stats">
      <div className="territorial-stat-card">
        <div className="territorial-stat-icon icon-green">
          <Users size={18} />
        </div>
        <div className="territorial-stat-text">
          <p>Total Personal</p>
          <h3>{total}</h3>
        </div>
      </div>

      <div className="territorial-stat-card">
        <div className="territorial-stat-icon icon-blue">
          <CheckCircle size={18} />
        </div>
        <div className="territorial-stat-text">
          <p>Activos</p>
          <h3>{activos}</h3>
        </div>
      </div>

      <div className="territorial-stat-card">
        <div className="territorial-stat-icon icon-red">
          <XCircle size={18} />
        </div>
        <div className="territorial-stat-text">
          <p>Inactivos</p>
          <h3>{inactivos}</h3>
        </div>
      </div>
    </div>
  );
}