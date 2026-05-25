import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../../app/layouts/DashboardLayout';
import { progresoService } from '../services/progresoService';
import programacionService from '../../programacion/services/programacionService';
import ProgressBar from '../components/ProgressBar';
import RegistroDiarioForm from '../components/RegistroDiarioForm';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const normalizeProgramaciones = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.programaciones)) return payload.programaciones;
  return [];
};

const ProgresoProyectoPage = () => {
  const { proyectoId } = useParams();
  const navigate = useNavigate();
  const [progreso, setProgreso] = useState(null);
  const [programaciones, setProgramaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const cargarProgreso = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await progresoService.getProgresoProyecto(proyectoId);
      setProgreso(response?.data ?? response ?? null);
    } catch (err) {
      console.error('Error cargando progreso del proyecto:', err);
      setError(err?.message || err?.error || 'No se pudo cargar el progreso del proyecto.');
    } finally {
      setLoading(false);
    }
  };

  const cargarProgramaciones = async () => {
    try {
      const response = await programacionService.getAll({ proyecto: proyectoId });
      const items = normalizeProgramaciones(response);

      if (items.length === 0) {
        const fallback = await programacionService.getActivas();
        setProgramaciones(normalizeProgramaciones(fallback));
      } else {
        setProgramaciones(items);
      }
    } catch (err) {
      console.error('Error cargando programaciones:', err);
      setProgramaciones([]);
    }
  };

  useEffect(() => {
    if (!proyectoId) return;
    cargarProgreso();
    cargarProgramaciones();
  }, [proyectoId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!proyectoId) return;
      setRefreshing(true);
      cargarProgreso().finally(() => setRefreshing(false));
    }, 30000);

    return () => clearInterval(timer);
  }, [proyectoId]);

  const handleRegistroGuardado = async () => {
    await cargarProgreso();
  };

  const proyecto = progreso;
  const subproyectos = proyecto?.subproyectos ?? [];

  const renderContrato = (contrato) => (
    <div key={contrato._id} style={{ marginBottom: 20, padding: 18, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{contrato.codigo || 'Contrato'}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{contrato.estado || 'EN_PROGRESO'}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{Math.round(contrato.porcentaje || 0)}%</span>
          <span style={{ fontSize: 13, color: '#475569' }}>
            {contrato.cantidad_ejecutada ?? 0} / {contrato.cantidad_proyectada ?? 0}
          </span>
        </div>
      </div>

      <ProgressBar
        label={`Contrato ${contrato.codigo || ''}`}
        porcentaje={contrato.porcentaje || 0}
        estado={contrato.estado || 'EN_PROGRESO'}
        completados={contrato.cantidad_ejecutada ?? 0}
        total={contrato.cantidad_proyectada ?? 0}
      />

      {Array.isArray(contrato.programaciones) && contrato.programaciones.length > 0 && (
        <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          {contrato.programaciones.map((prog) => (
            <div key={prog._id} style={{ padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{prog.nombre || prog.actividad?.nombre || 'Programación'}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{prog.estado || 'EN_PROGRESO'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontWeight: 700, color: '#2563eb' }}>{Math.round(prog.porcentaje || 0)}%</span>
                  <span style={{ fontSize: 12, color: '#475569' }}>{prog.cantidad_ejecutada ?? 0} / {prog.cantidad_proyectada ?? 0}</span>
                </div>
              </div>

              <ProgressBar
                label={prog.nombre || prog.actividad?.nombre || 'Programación'}
                porcentaje={prog.porcentaje || 0}
                estado={prog.estado || 'EN_PROGRESO'}
                completados={prog.cantidad_ejecutada ?? 0}
                total={prog.cantidad_proyectada ?? 0}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#3b82f6',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: 0,
              }}
            >
              <ArrowLeft size={18} /> Volver
            </button>

            <h1 style={{ margin: '12px 0 4px', fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
              Progreso del proyecto
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
              Visualiza barras de progreso reales y registra actividades diarias.
            </p>
          </div>

          <button
            type="button"
            onClick={cargarProgreso}
            disabled={loading}
            style={{
              background: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              padding: '12px 18px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <RefreshCw size={18} /> {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 32, background: '#fff', borderRadius: 16, textAlign: 'center', color: '#64748b' }}>
            Cargando progreso del proyecto...
          </div>
        ) : error ? (
          <div style={{ padding: 24, background: '#fee2e2', borderRadius: 16, color: '#991b1b' }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 24, alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569' }}>
                      Proyecto
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                      {proyecto?.nombre || 'Proyecto desconocido'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 14 }}>
                      Código: {proyecto?.codigo || '—'}
                    </div>
                  </div>
                  <span style={{ padding: '8px 12px', borderRadius: 999, background: '#eef2ff', color: '#1d4ed8', fontWeight: 700, fontSize: 12 }}>
                    {proyecto?.estado || 'EN_PROGRESO'}
                  </span>
                </div>

                <ProgressBar
                  label="Progreso general"
                  porcentaje={proyecto?.porcentaje ?? proyecto?.porcentaje_total ?? 0}
                  estado={proyecto?.estado || 'EN_PROGRESO'}
                  completados={proyecto?.cantidad_ejecutada_total ?? 0}
                  total={proyecto?.cantidad_proyectada_total ?? 0}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 18 }}>
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Subproyectos</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{proyecto?.total_subproyectos ?? 0}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Ejecutado</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{proyecto?.cantidad_ejecutada_total ?? 0}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Proyectado</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{proyecto?.cantidad_proyectada_total ?? 0}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 18 }}>
                {subproyectos.length === 0 ? (
                  <div style={{ padding: 24, background: '#fff', borderRadius: 16, textAlign: 'center', color: '#64748b' }}>
                    Este proyecto no tiene subproyectos registrados.
                  </div>
                ) : (
                  subproyectos.map((sub) => (
                    <div key={sub._id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 22, display: 'grid', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{sub.nombre || sub.codigo || 'Subproyecto'}</div>
                          <div style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>{sub.estado || 'EN_PROGRESO'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb' }}>{Math.round(sub.porcentaje || 0)}%</div>
                          <div style={{ color: '#475569', fontSize: 13 }}>{sub.cantidad_ejecutada ?? 0} / {sub.cantidad_proyectada ?? 0}</div>
                        </div>
                      </div>

                      <ProgressBar
                        label={`Subproyecto ${sub.codigo || ''}`}
                        porcentaje={sub.porcentaje || 0}
                        estado={sub.estado || 'EN_PROGRESO'}
                        completados={sub.cantidad_ejecutada ?? 0}
                        total={sub.cantidad_proyectada ?? 0}
                      />

                      {Array.isArray(sub.contratos) && sub.contratos.length > 0 && (
                        <div style={{ display: 'grid', gap: 18 }}>
                          {sub.contratos.map((contrato) => renderContrato(contrato))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 20 }}>
              <RegistroDiarioForm programaciones={programaciones} onRegistroGuardado={handleRegistroGuardado} />

              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 22 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>¿Cómo funciona?</h3>
                <p style={{ margin: '12px 0 0', color: '#475569', fontSize: 14, lineHeight: 1.7 }}>
                  Registra la actividad diaria desde aquí y el backend recalculará el progreso en cascada.
                  Después el panel se actualizará automáticamente para mostrar el avance real del proyecto,
                  subproyectos, contratos y programaciones.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProgresoProyectoPage;
