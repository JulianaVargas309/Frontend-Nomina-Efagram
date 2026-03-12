// ==========================================
// COMPONENTE: BARRA DE PROGRESO
// ==========================================
// Descripción: Barra visual de progreso con porcentaje
// Ubicación: src/features/programacion/components/BarraProgreso.jsx

export default function BarraProgreso({
  porcentaje = 0,
  cantidad = 0,
  cantidadProyectada = 0,
  showLabel = false,
  className = '',
}) {
  // Asegurar que el porcentaje no exceda 100 para la visualización
  const porcentajeVisual = Math.min(porcentaje, 100);

  // Determinar color según porcentaje
  const getColor = () => {
    if (porcentajeVisual >= 100) return '#10b981'; // Verde
    if (porcentajeVisual >= 75) return '#3b82f6'; // Azul
    if (porcentajeVisual >= 50) return '#f59e0b'; // Ámbar
    if (porcentajeVisual >= 25) return '#ef4444'; // Rojo
    return '#6b7280'; // Gris
  };

  return (
    <div className={`barra-progreso ${className}`}>
      <div className="progreso-container">
        <div
          className="progreso-bar"
          style={{
            width: `${porcentajeVisual}%`,
            backgroundColor: getColor(),
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div className="progreso-info">
        <span className="porcentaje">{porcentaje}%</span>
        {showLabel && (
          <span className="cantidad">
            ({cantidad} / {cantidadProyectada})
          </span>
        )}
      </div>

      {porcentaje > 100 && (
        <span className="exceso-badge">+{porcentaje - 100}%</span>
      )}
    </div>
  );
}