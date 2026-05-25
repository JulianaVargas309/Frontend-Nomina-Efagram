import React, { useState, useEffect } from 'react';
import { getProgresosAll } from '../services/proyectosService';
import ProgressBar from './ProgressBar';
import { Folder, AlertCircle, Loader } from 'lucide-react';

/**
 * ProjectProgressList - Componente que muestra lista de proyectos con su progreso
 * 
 * Características:
 * - Lista todos los proyectos con su porcentaje de progreso
 * - Actualización automática cada 30 segundos
 * - Manejo de estados: loading, error, éxito
 * - Click en un proyecto para ver detalles cascada
 */
const ProjectProgressList = ({ onSelectProject = null }) => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchProyectos = async () => {
    try {
      setError(null);
      const response = await getProgresosAll();
      
      if (response?.data?.data) {
        setProyectos(response.data.data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error fetching proyectos progreso:', err);
      setError(err?.response?.data?.message || 'Error al obtener proyectos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProyectos();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchProyectos, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && proyectos.length === 0) {
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
        <p style={{ marginTop: '16px' }}>Cargando proyectos...</p>
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
          <p style={{ margin: '0', color: '#991b1b', fontWeight: '600' }}>Error al cargar proyectos</p>
          <p style={{ margin: '4px 0 0', color: '#7f1d1d', fontSize: '14px' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (proyectos.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: '#6b7280',
      }}>
        <Folder size={32} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <p>No hay proyectos para mostrar</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header con información de actualización */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '700',
          color: '#0f172a',
        }}>
          📊 Estado de Proyectos
        </h2>
        {lastUpdate && (
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: '#9ca3af',
          }}>
            Actualizado: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Lista de proyectos */}
      {proyectos.map((proyecto) => (
        <div
          key={proyecto._id}
          onClick={() => onSelectProject && onSelectProject(proyecto._id)}
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            cursor: onSelectProject ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          }}
          onMouseEnter={(e) => {
            if (onSelectProject) {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = '#d1d5db';
            }
          }}
          onMouseLeave={(e) => {
            if (onSelectProject) {
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <Folder size={20} color="#6366f1" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '700',
                color: '#1f2937',
              }}>
                {proyecto.nombre}
              </h3>
              {proyecto.descripcion && (
                <p style={{
                  margin: '4px 0 0',
                  fontSize: '13px',
                  color: '#6b7280',
                }}>
                  {proyecto.descripcion}
                </p>
              )}
            </div>
          </div>

          <ProgressBar
            porcentaje={proyecto.porcentaje_total || 0}
            estado={proyecto.estado || 'EN_PROGRESO'}
            label="Progreso General"
          />

          {/* Estadísticas */}
          {proyecto.subproyectos_completados !== undefined && (
            <p style={{
              margin: '8px 0 0',
              fontSize: '12px',
              color: '#6b7280',
            }}>
              {proyecto.subproyectos_completados} de {proyecto.total_subproyectos} subproyectos completados
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProjectProgressList;
