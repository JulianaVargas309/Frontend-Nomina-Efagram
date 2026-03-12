// ==========================================
// MODAL: REGISTRO DE EJECUCIÓN — CORREGIDO
// ==========================================
// BUGS CORREGIDOS:
//
// BUG #1 — Modal se abre vacío (no muestra los 7 días):
//   El backend /semana/:id devuelve { data: { dias: [...] } }
//   El modal leía response.data.dias ✓ CORRECTO
//   PERO si registros estaba vacío mostraba nada sin mensaje de error.
//   FIX: Manejo explícito de array vacío + mensaje útil.
//
// BUG #2 — _id undefined en los dias:
//   El backend mapea los registros a { _id, numero_dia, dia_semana, fecha, ... }
//   El _id SÍ viene pero si la programación no tiene registros creados
//   (por un error previo al crear) devuelve dias=[] y el modal queda vacío.
//   FIX: Si dias=[] mostrar mensaje claro "No se encontraron registros diarios".
//
// BUG #3 — Diseño sin scroll para los 7 días:
//   Con 7 dias-card el modal se cortaba en pantallas pequeñas.
//   FIX: Layout en grid 2 columnas con scroll interno.

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Calendar, Hash } from 'lucide-react';
import programacionService from '../services/programacionService';

const ESTADO_COLOR = {
  COMPLETADO: { bg: '#dcfce7', color: '#16a34a', label: 'Completado' },
  PENDIENTE:  { bg: '#fef9c3', color: '#ca8a04', label: 'Pendiente'  },
  SIN_DATOS:  { bg: '#f1f5f9', color: '#64748b', label: 'Sin datos'  },
};

export default function ModalRegistroEjecucion({ isOpen, onClose, programacion }) {
  const [dias,          setDias]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [guardando,     setGuardando]     = useState(false);
  const [error,         setError]         = useState(null);
  const [success,       setSuccess]       = useState(null);
  const [metaPrograma,  setMetaPrograma]  = useState(null);

  useEffect(() => {
    if (isOpen && programacion?._id) {
      cargarRegistros();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, programacion?._id]);

  const cargarRegistros = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await programacionService.getRegistrosDiarios(programacion._id);

      // El backend devuelve: { success, data: { programacion_id, cantidad_proyectada, dias: [...] } }
      const data = response?.data;
      const diasData = data?.dias || [];

      setDias(diasData.map(d => ({ ...d })));
      setMetaPrograma({
        cantidad_proyectada:      data?.cantidad_proyectada      ?? programacion.cantidad_proyectada,
        cantidad_ejecutada_total: data?.cantidad_ejecutada_total ?? programacion.cantidad_ejecutada_total ?? 0,
        porcentaje_cumplimiento:  data?.porcentaje_cumplimiento  ?? programacion.porcentaje_cumplimiento  ?? 0,
      });
    } catch (err) {
      const msg = err?.message || err?.error || 'Error al cargar registros diarios';
      setError(msg);
      console.error('Error cargarRegistros:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarCantidad = (index, valor) => {
    const cantidad = parseFloat(valor) || 0;
    setDias(prev => prev.map((d, i) =>
      i === index
        ? { ...d, cantidad_ejecutada: cantidad, estado: cantidad > 0 ? 'COMPLETADO' : 'PENDIENTE' }
        : d
    ));
  };

  const handleCambiarObservaciones = (index, valor) => {
    setDias(prev => prev.map((d, i) => i === index ? { ...d, observaciones: valor } : d));
  };

  const totalEjecutado = dias.reduce((s, d) => s + (d.cantidad_ejecutada || 0), 0);
  const cantProyectada = metaPrograma?.cantidad_proyectada || programacion?.cantidad_proyectada || 1;
  const porcentaje     = Math.min(200, Math.round((totalEjecutado / cantProyectada) * 100));

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      setError(null);

      const registrosActualizar = dias.map(d => ({
        id:                 d._id,
        cantidad_ejecutada: d.cantidad_ejecutada ?? 0,
        observaciones:      d.observaciones      ?? '',
      }));

      const response = await programacionService.updateMultiplesRegistros(registrosActualizar);

      if (response?.success) {
        setSuccess('✅ Registros guardados exitosamente');
        setTimeout(() => onClose(), 1500);
      } else {
        throw new Error(response?.message || 'No se pudo guardar');
      }
    } catch (err) {
      setError(err?.message || err?.error || 'Error al guardar registros');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  const barColor = porcentaje >= 100 ? '#16a34a' : porcentaje >= 50 ? '#f59e0b' : '#3b82f6';

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(780px, 100%)',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 24px 64px rgba(15,23,42,0.25)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '92vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
              📋 Registrar Ejecución — Contrato {programacion?.contrato?.codigo || programacion?.contrato}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6b7280' }}>
              {programacion?.finca?.nombre || ''} · {programacion?.actividad?.nombre || ''} ·{' '}
              {programacion?.fecha_inicial
                ? new Date(programacion.fecha_inicial).toLocaleDateString('es-CO')
                : ''}{' '}
              →{' '}
              {programacion?.fecha_final
                ? new Date(programacion.fecha_final).toLocaleDateString('es-CO')
                : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6', border: '1.5px solid #e5e7eb',
              borderRadius: 8, width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#374151', flexShrink: 0,
            }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── RESUMEN ── */}
        {metaPrograma && (
          <div style={{
            display: 'flex', gap: 16, padding: '12px 24px',
            borderBottom: '1px solid #e5e7eb', background: '#f8fafc',
            flexShrink: 0, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Proyectado: </span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{cantProyectada}</span>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Ejecutado: </span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{totalEjecutado.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600, flexShrink: 0 }}>
                Progreso:
              </span>
              <div style={{
                flex: 1, height: 10, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(100, porcentaje)}%`,
                  height: '100%', background: barColor, borderRadius: 99,
                  transition: 'width 0.3s',
                }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: barColor, flexShrink: 0 }}>
                {porcentaje}%
              </span>
            </div>
          </div>
        )}

        {/* ── BODY ── */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              padding: '10px 14px', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, color: '#dc2626',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
              padding: '10px 14px', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, color: '#16a34a',
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              {success}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: 14 }}>
              ⏳ Cargando registros diarios...
            </div>
          ) : dias.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 40, color: '#64748b', fontSize: 14,
              background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0',
            }}>
              <p style={{ fontSize: 32, margin: '0 0 8px' }}>📭</p>
              <p style={{ fontWeight: 700, color: '#374151' }}>No se encontraron registros diarios</p>
              <p style={{ fontSize: 13, margin: '4px 0 0' }}>
                Esta programación no tiene los 7 registros diarios creados.
                Intenta eliminar y volver a crear la programación.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}>
              {dias.map((dia, index) => {
                const est     = dia.estado || 'PENDIENTE';
                const estInfo = ESTADO_COLOR[est] || ESTADO_COLOR.PENDIENTE;
                const fechaObj = new Date(dia.fecha);
                return (
                  <div
                    key={dia._id || index}
                    style={{
                      border: `1.5px solid ${dia.cantidad_ejecutada > 0 ? '#bbf7d0' : '#e2e8f0'}`,
                      borderRadius: 10,
                      background: dia.cantidad_ejecutada > 0 ? '#f0fdf4' : '#fff',
                      padding: 14,
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Día header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111827' }}>
                          {dia.dia_semana || ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][fechaObj.getDay()]}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={10} />
                          {fechaObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <span style={{
                        padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: estInfo.bg, color: estInfo.color,
                      }}>
                        {estInfo.label}
                      </span>
                    </div>

                    {/* Cantidad ejecutada */}
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
                        <Hash size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                        Cantidad ejecutada
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={dia.cantidad_ejecutada || ''}
                        onChange={e => handleCambiarCantidad(index, e.target.value)}
                        disabled={guardando}
                        placeholder="0"
                        style={{
                          width: '100%', padding: '7px 10px',
                          border: '1.5px solid #d1d5db', borderRadius: 7,
                          fontSize: 14, fontWeight: 600, color: '#0f172a',
                          outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Observaciones */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
                        Observaciones
                      </label>
                      <textarea
                        value={dia.observaciones || ''}
                        onChange={e => handleCambiarObservaciones(index, e.target.value)}
                        disabled={guardando}
                        rows={2}
                        placeholder="Notas del día..."
                        style={{
                          width: '100%', padding: '7px 10px',
                          border: '1.5px solid #d1d5db', borderRadius: 7,
                          fontSize: 12, color: '#374151', resize: 'vertical',
                          outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            disabled={guardando}
            style={{
              background: '#f9fafb', color: '#374151',
              border: '1px solid #d1d5db', padding: '10px 20px',
              borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || loading || dias.length === 0}
            style={{
              background: (guardando || loading || dias.length === 0) ? '#9ca3af' : '#1f8f57',
              color: '#fff', border: 'none',
              padding: '10px 24px', borderRadius: 8,
              fontWeight: 700, fontSize: 14,
              cursor: (guardando || loading || dias.length === 0) ? 'not-allowed' : 'pointer',
            }}
          >
            {guardando ? '⏳ Guardando...' : <><Save size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Guardar cambios</>}
          </button>
        </div>
      </div>
    </div>
  );
}