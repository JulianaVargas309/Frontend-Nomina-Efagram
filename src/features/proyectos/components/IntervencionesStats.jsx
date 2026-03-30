import { Activity, Layers, BarChart2 } from 'lucide-react';

export default function IntervencionesStats({ intervenciones = [] }) {
  const total = intervenciones.length;

  // El backend devuelve cada intervención con UN proceso (objeto poblado)
  // Contamos cuántas intervenciones tienen proceso asignado
  const totalProcesos = intervenciones.filter(
    (i) => i?.proceso && (i.proceso._id || i.proceso.id || typeof i.proceso === 'string')
  ).length;

  // Promedio: procesos únicos referenciados por intervención
  const promedio = total > 0 ? (totalProcesos / total).toFixed(1) : '0.0';

  return (
    <div className="territorial-stats">
      {[
        { icon: Activity,  label: 'Total Intervenciones', value: total,         color: 'icon-green' },
        { icon: Layers,    label: 'Total Procesos',        value: totalProcesos, color: 'icon-blue'  },
        { icon: BarChart2, label: 'Promedio Procesos',     value: promedio,      color: 'icon-teal'  },
      ].map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="territorial-stat-card">
          <div className={`territorial-stat-icon ${color}`}><Icon size={18} /></div>
          <div className="territorial-stat-text">
            <p>{label}</p>
            <h3>{value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}