import React, { useState, useEffect } from 'react';
import { getProgresoProyecto, getProgresoSubproyectos } from '../services/proyectosService';
import ProgressBar from './ProgressBar';
import { ChevronDown, ChevronUp, AlertCircle, Loader, ArrowLeft } from 'lucide-react';

/**
 * ProjectDetailProgress - Componente que muestra cascada completa de progreso
 * 
 * Props:
 * - projectId: string - ID del proyecto
 * - onBack: function - callback para volver
 * 
 * Muestra:
 * - Barra principal del proyecto
 * - Lista de subproyectos expandibles
 * - Detalles de cada subproyecto
 */
const ProjectDetailProgress = ({ projectId, onBack }) => {
  const [proyecto, setProyecto] = useState(null);
  const [subproyectos, setSubproyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSubproyecto, setExpandedSubproyecto] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener datos en paralelo
        const [projRes, subRes] = await Promise.all([
          getProgresoProyecto(projectId),
          getProgresoSubproyectos(projectId),
        ]);

        if (projRes?.data?.data) {
          setProyecto(projRes.data.data);
        }

        if (subRes?.data?.data) {
          setSubproyectos(subRes.data.data.subproyectos || []);
        }
      } catch (err) {
        console.error('Error fetching project detail:', err);
        setError(err?.response?.data?.message || 'Error al obtener detalles del proyecto');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        color: '#6b7280',
      }}>
        <Loader size={32} style={{ animation: 'spin 2s linear infinite' }} />
        <p style={{ marginTop: '16px' }}>Cargando detalles del proyecto...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ margin: '0', color: '#991b1b', fontWeight: '600' }}>Error al cargar detalles</p>
          <p style={{ margin: '4px 0 0', color: '#7f1d1d', fontSize: '14px' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!proyecto) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: '#6b7280',
      }}>
        <p>No hay datos disponibles para este proyecto</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Botón volver */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: '#6366f1',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            padding: '0',
          }}
        >
          <ArrowLeft size={16} />
          Volver a proyectos
        </button>
      )}

      {/* Barra principal del proyecto */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '24px',
        color: 'white',
      }}>
        <h2 style={{
          margin: '0 0 16px',
          fontSize: '24px',
          fontWeight: '800',
          color: 'white',
        }}>
          📊 {proyecto.nombre}
        </h2>

        {proyecto.descripcion && (
          <p style={{
            margin: '0 0 16px',
            fontSize: '14px',
            opacity: 0.9,
          }}>
            {proyecto.descripcion}
          </p>
        )}

        {/* Barra de progreso en contexto principal */}
        <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '16px', borderRadius: '8px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Progreso Total</span>
            <span style={{ fontSize: '24px', fontWeight: '800' }}>
              {Math.round(proyecto.porcentaje_total || 0)}%
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '28px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(proyecto.porcentaje_total || 0, 100)}%`,
                backgroundColor: '#10b981',
                transition: 'width 0.5s ease-in-out',
              }}
            />
          </div>
        </div>

        {proyecto.subproyectos_completados !== undefined && (
          <p style={{
            margin: '16px 0 0',
            fontSize: '13px',
            opacity: 0.9,
          }}>
            ✓ {proyecto.subproyectos_completados} de {proyecto.total_subproyectos} subproyectos completados
          </p>
        )}
      </div>

      {/* Sección de subproyectos */}
      <div>
        <h3 style={{
          margin: '0 0 16px',
          fontSize: '18px',
          fontWeight: '700',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          📋 Subproyectos ({subproyectos.length})
        </h3>

        {subproyectos.length === 0 ? (
          <p style={{
            padding: '24px',
            textAlign: 'center',
            color: '#9ca3af',
            background: '#f9fafb',
            borderRadius: '8px',
          }}>
            No hay subproyectos en este proyecto
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {subproyectos.map((sub) => (
              <div
                key={sub._id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              >
                {/* Header del subproyecto */}
                <button
                  onClick={() =>
                    setExpandedSubproyecto(
                      expandedSubproyecto === sub._id ? null : sub._id
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: expandedSubproyecto === sub._id ? '#f3f4f6' : 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (expandedSubproyecto !== sub._id) {
                      e.currentTarget.style.background = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (expandedSubproyecto !== sub._id) {
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  {expandedSubproyecto === sub._id ? (
                    <ChevronUp size={20} color="#6366f1" />
                  ) : (
                    <ChevronDown size={20} color="#6366f1" />
                  )}

                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1f2937',
                    }}>
                      {sub.nombre}
                    </h4>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#3b82f6',
                    }}>
                      {Math.round(sub.porcentaje || 0)}%
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: sub.porcentaje === 100 ? '#d1fae5' : '#dbeafe',
                      color: sub.porcentaje === 100 ? '#065f46' : '#1e40af',
                    }}>
                      {sub.estado || 'EN_PROGRESO'}
                    </span>
                  </div>
                </button>

                {/* Contenido expandido */}
                {expandedSubproyecto === sub._id && (
                  <div style={{
                    padding: '16px',
                    background: '#f9fafb',
                    borderTop: '1px solid #e5e7eb',
                  }}>
                    <ProgressBar
                      porcentaje={sub.porcentaje || 0}
                      estado={sub.estado || 'EN_PROGRESO'}
                      label="Progreso del Subproyecto"
                      showDetails
                      completados={sub.total_programaciones - (sub.total_programaciones - sub.programaciones_completadas)}
                      total={sub.total_programaciones}
                    />

                    {/* Detalles de programaciones */}
                    {sub.detalles && sub.detalles.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <p style={{
                          margin: '0 0 8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                        }}>
                          Detalle de Programaciones
                        </p>
                        <div style={{
                          background: 'white',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1px solid #e5e7eb',
                        }}>
                          {sub.detalles.slice(0, 3).map((det, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '8px 12px',
                                borderBottom: idx < Math.min(3, sub.detalles.length - 1) ? '1px solid #f3f4f6' : 'none',
                                fontSize: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span style={{ color: '#6b7280' }}>
                                {det.cantidad_ejecutada} / {det.cantidad_proyectada}
                              </span>
                              <span style={{
                                fontWeight: '600',
                                color: det.porcentaje === 100 ? '#10b981' : '#3b82f6',
                              }}>
                                {Math.round(det.porcentaje || 0)}%
                              </span>
                            </div>
                          ))}
                          {sub.detalles.length > 3 && (
                            <div style={{
                              padding: '8px 12px',
                              fontSize: '12px',
                              color: '#6366f1',
                              fontWeight: '600',
                              textAlign: 'center',
                            }}>
                              +{sub.detalles.length - 3} más...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailProgress;
