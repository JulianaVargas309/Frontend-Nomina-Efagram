import React from 'react';

/**
 * ProgressBar - Componente reutilizable de barra de progreso
 * 
 * Props:
 * - porcentaje: número (0-100)
 * - estado: string (COMPLETADO, EN_PROGRESO, CANCELADO)
 * - label: string - etiqueta a mostrar
 * - showDetails: boolean - mostrar detalles adicionales
 * - completados: number - items completados
 * - total: number - total de items
 */
const ProgressBar = ({ 
  porcentaje = 0, 
  estado = 'EN_PROGRESO',
  label = 'Progreso',
  showDetails = false,
  completados = 0,
  total = 0
}) => {
  // Asegurar que el porcentaje no exceda 100 para la visualización
  const porcentajeVisual = Math.min(Math.max(porcentaje, 0), 100);

  // Determinar color según porcentaje
  const getColor = () => {
    if (porcentajeVisual === 100) return '#10b981'; // Verde
    if (porcentajeVisual >= 75) return '#3b82f6'; // Azul
    if (porcentajeVisual >= 50) return '#f59e0b'; // Ámbar
    if (porcentajeVisual >= 25) return '#ef4444'; // Rojo
    return '#6b7280'; // Gris
  };

  // Determinar color de badge según estado
  const getEstadoColor = () => {
    switch (estado) {
      case 'COMPLETADO':
        return { bg: '#d1fae5', text: '#065f46' };
      case 'EN_PROGRESO':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'CANCELADO':
        return { bg: '#fee2e2', text: '#7f1d1d' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const estadoColor = getEstadoColor();

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Label y porcentaje */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1f2937',
        }}>
          {label}
        </label>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{
            fontSize: '16px',
            fontWeight: '700',
            color: getColor(),
          }}>
            {Math.round(porcentajeVisual)}%
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: estadoColor.bg,
            color: estadoColor.text,
            letterSpacing: '0.5px',
          }}>
            {estado}
          </span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div style={{
        width: '100%',
        height: '24px',
        backgroundColor: '#e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '8px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      }}>
        <div
          style={{
            height: '100%',
            width: `${porcentajeVisual}%`,
            backgroundColor: getColor(),
            transition: 'width 0.5s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {porcentajeVisual > 10 && (
            <span style={{
              color: 'white',
              fontSize: '11px',
              fontWeight: '600',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}>
              {Math.round(porcentajeVisual)}%
            </span>
          )}
        </div>
      </div>

      {/* Detalles si se solicitan */}
      {showDetails && completados !== undefined && total !== undefined && (
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          margin: '4px 0 0',
        }}>
          {completados} de {total} completados
        </p>
      )}
    </div>
  );
};

export default ProgressBar;
