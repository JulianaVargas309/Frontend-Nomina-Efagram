import { MapPin, CheckCircle, XCircle } from 'lucide-react';

export default function TerritorialStats({ zonas = [] }) {
  const totalZonas = zonas.length;

  const isActive = (z) => {
    const raw = z?.activa ?? z?.estado;
    if (raw === undefined || raw === null) return true; // fallback
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'string') return raw === 'activa' || raw === 'true' || raw === '1';
    return false;
  };

  const activas = zonas.filter((z) => isActive(z) === true).length;
  const inactivas = zonas.filter((z) => isActive(z) === false).length;

  return (
    <div className="territorial-stats">

      <div className="territorial-stat-card">
        <div className="territorial-stat-icon icon-green">
          <MapPin size={16} />
        </div>
        <div className="territorial-stat-text">
          <p>Total Zonas</p>
          <h3>{totalZonas}</h3>
        </div>
      </div>

      <div className="territorial-stat-card">
        <div className="territorial-stat-icon icon-blue">
          <CheckCircle size={16} />
        </div>
        <div className="territorial-stat-text">
          <p>Activas</p>
          <h3>{activas}</h3>
        </div>
      </div>

      <div className="territorial-stat-card">
        <div className="territorial-stat-icon icon-red">
          <XCircle size={16} />
        </div>
        <div className="territorial-stat-text">
          <p>Inactivas</p>
          <h3>{inactivas}</h3>
        </div>
      </div>

    </div>
  );
}