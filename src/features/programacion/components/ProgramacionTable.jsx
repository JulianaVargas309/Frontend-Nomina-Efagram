// ==========================================
// COMPONENTE: TABLA PROGRAMACIÓN
// ==========================================
// Descripción: Tabla que muestra todas las programaciones
// Ubicación: src/features/programacion/components/ProgramacionTable.jsx

import { Edit2, Trash2, Eye, Zap } from 'lucide-react';
import BarraProgreso from './BarraProgreso';

export default function ProgramacionTable({
  programaciones,
  loading,
  onRegistrarEjecucion,
  onEliminar,
}) {
  if (loading) {
    return (
      <div className="tabla-container">
        <div className="loading">Cargando programaciones...</div>
      </div>
    );
  }

  if (programaciones.length === 0) {
    return (
      <div className="tabla-container">
        <div className="empty-state">
          <Zap size={48} />
          <h3>No hay programaciones</h3>
          <p>Crea una nueva programación para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tabla-container">
      <table className="programacion-table">
        <thead>
          <tr>
            <th>Contrato</th>
            <th>Finca</th>
            <th>Lote</th>
            <th>Actividad</th>
            <th>Proyectado</th>
            <th>Ejecutado</th>
            <th>Fechas</th>
            <th>Semana</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {programaciones.map((prog) => (
            <tr key={prog._id} className={`estado-${prog.estado?.toLowerCase()}`}>
              {/* Contrato */}
              <td className="font-bold">
                <span className="badge badge-info">{prog.contrato?.codigo || 'N/A'}</span>
              </td>

              {/* Finca */}
              <td>{prog.finca?.nombre || 'N/A'}</td>

              {/* Lote */}
              <td>{prog.lote?.nombre || 'N/A'}</td>

              {/* Actividad */}
              <td>{prog.actividad?.nombre || 'N/A'}</td>

              {/* Proyectado */}
              <td className="proyectado">
                <div className="cantidad">
                  {prog.cantidad_proyectada}
                </div>
                <div className="valor">
                  ${prog.valor_proyectado?.toLocaleString() || '0'}
                </div>
              </td>

              {/* Ejecutado (Barra de progreso + Porcentaje) */}
              <td className="ejecutado">
                <BarraProgreso
                  porcentaje={prog.porcentaje_cumplimiento}
                  cantidad={prog.cantidad_ejecutada_total}
                  cantidadProyectada={prog.cantidad_proyectada}
                />
              </td>

              {/* Fechas */}
              <td className="fechas">
                <div className="fecha-inicio">
                  {new Date(prog.fecha_inicial).toLocaleDateString('es-CO')}
                </div>
                <div className="fecha-fin">
                  {new Date(prog.fecha_final).toLocaleDateString('es-CO')}
                </div>
              </td>

              {/* Semana */}
              <td>
                <span className={`badge badge-semana semana-${prog.semana}`}>
                  Semana {prog.semana}
                </span>
              </td>

              {/* Acciones */}
              <td className="acciones">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => onRegistrarEjecucion(prog)}
                  title="Registrar ejecución diaria"
                >
                  <Eye size={16} />
                  Detalles
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => onEliminar(prog._id)}
                  title="Eliminar programación"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}