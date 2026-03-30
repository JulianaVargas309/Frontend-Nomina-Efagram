import { Settings, CheckCircle, XCircle } from 'lucide-react';

export default function ProcesosStats({ procesos = [] }) {
  const totalProcesos = procesos.length;

  // Contar activos e inactivos
  const activos = procesos.filter((p) => {
    if (typeof p?.estado === 'boolean') return p.estado;
    if (typeof p?.estado === 'string') {
      const est = p.estado.toLowerCase().trim();
      return est === 'activo' || est === 'active' || est === 'true' || est === '1';
    }
    if (typeof p?.estado === 'number') return p.estado === 1;
    return true; // Por defecto activo
  }).length;

  const inactivos = totalProcesos - activos;

  return (
    <div className="territorial-stats">

      <div className="territorial-stat-card">
        <div className="territorial-stat-icon icon-green">
          <Settings size={16} />
        </div>
        <div className="territorial-stat-text">
          <p>Total Procesos</p>
          <h3>{totalProcesos}</h3>
        </div>
      </div>

      <div className="territorial-stat-card">
        <div className="territorial-stat-icon icon-blue">
          <CheckCircle size={16} />
        </div>
        <div className="territorial-stat-text">
          <p>Activos</p>
          <h3>{activos}</h3>
        </div>
      </div>

      <div className="territorial-stat-card">
        <div className="territorial-stat-icon icon-red">
          <XCircle size={16} />
        </div>
        <div className="territorial-stat-text">
          <p>Inactivos</p>
          <h3>{inactivos}</h3>
        </div>
      </div>

    </div>
  );
}