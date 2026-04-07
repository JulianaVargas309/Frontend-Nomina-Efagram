import { useEffect, useState } from 'react';
import { Users, Clock, X, Plus, Trash2, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import httpClient from '../../../core/api/httpClient';
import { updateSubproyecto } from '../services/subproyectosService';
import { registrarHorasNoTrabajadas } from '../services/horasService';

/* ─── Helpers ─────────────────────────────────────────────────── */
const Badge = ({ children, color = '#64748b', bg = '#f1f5f9' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 10px', borderRadius: 999,
    fontSize: 11, fontWeight: 700,
    color, background: bg,
  }}>
    {children}
  </span>
);

const Tab = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 18px',
      background: active ? '#fff' : 'transparent',
      border: 'none',
      borderBottom: active ? '2px solid #1f8f57' : '2px solid transparent',
      color: active ? '#1f8f57' : '#64748b',
      fontWeight: active ? 800 : 600,
      fontSize: 14, cursor: 'pointer',
      transition: 'all 0.15s',
    }}
  >
    {icon}
    {label}
    {count !== undefined && (
      <Badge
        color={active ? '#1f8f57' : '#64748b'}
        bg={active ? '#f0faf4' : '#f1f5f9'}
      >
        {count}
      </Badge>
    )}
  </button>
);

/* ─── MOTIVOS predefinidos ─────────────────────────────────────── */
const MOTIVOS = [
  'Lluvia',
  'Permiso personal',
  'Incapacidad médica',
  'Festivo',
  'Problema de transporte',
  'Otro',
];

/* ══════════════════════════════════════════════════════════════════
   MODAL PRINCIPAL
══════════════════════════════════════════════════════════════════ */
const GestionarSubproyectoModal = ({ isOpen, onClose, onSuccess, subproyecto }) => {
  const [tab, setTab] = useState('cuadrillas');

  // ── Estado cuadrillas ─────────────────────────────────────────
  const [todasCuadrillas, setTodasCuadrillas] = useState([]);
  const [cuadrillasSel, setCuadrillasSel] = useState([]);
  const [loadingCuadrillas, setLoadingCuadrillas] = useState(false);
  const [savingCuadrillas, setSavingCuadrillas] = useState(false);
  const [errorCuadrillas, setErrorCuadrillas] = useState('');
  const [okCuadrillas, setOkCuadrillas] = useState(false);

  // ── Estado horas ──────────────────────────────────────────────
  const [horaForm, setHoraForm] = useState({
    cuadrillaId: '',
    fecha: '',
    horas: '',
    motivo: '',
    motivoCustom: '',
  });
  const [savingHoras, setSavingHoras] = useState(false);
  const [errorHoras, setErrorHoras] = useState('');
  const [okHoras, setOkHoras] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  /* ── Cargar datos al abrir ─────────────────────────────────── */
  useEffect(() => {
    if (!isOpen || !subproyecto) return;
    setTab('cuadrillas');
    setErrorCuadrillas('');
    setOkCuadrillas(false);
    setErrorHoras('');
    setOkHoras(false);
    setHoraForm({ cuadrillaId: '', fecha: '', horas: '', motivo: '', motivoCustom: '' });

    const cargar = async () => {
      setLoadingCuadrillas(true);
      try {
        const res = await httpClient.get('/cuadrillas');
        setTodasCuadrillas(res?.data?.data ?? []);
        // Pre-seleccionar las que ya tiene el subproyecto
        const ids = (subproyecto.cuadrillas ?? []).map(c => c._id ?? c);
        setCuadrillasSel(ids);
      } catch {
        setTodasCuadrillas([]);
      } finally {
        setLoadingCuadrillas(false);
      }
    };
    cargar();
  }, [isOpen, subproyecto]);

  /* ── Cargar historial de horas al cambiar de tab ───────────── */
  useEffect(() => {
    if (tab !== 'horas' || !subproyecto) return;
    const cargar = async () => {
      setLoadingHistorial(true);
      try {
        const res = await httpClient.get('/horas-no-trabajadas/mensual', {
          params: {
            subproyectoId: subproyecto._id,
            mes: new Date().getMonth() + 1,
            anio: new Date().getFullYear(),
          },
        });
        setHistorial(res?.data ?? []);
      } catch {
        setHistorial([]);
      } finally {
        setLoadingHistorial(false);
      }
    };
    cargar();
  }, [tab, subproyecto]);

  /* ── Guardar cuadrillas ────────────────────────────────────── */
  const guardarCuadrillas = async () => {
    setErrorCuadrillas('');
    setOkCuadrillas(false);
    setSavingCuadrillas(true);
    try {
      await updateSubproyecto(subproyecto._id, { cuadrillas: cuadrillasSel });
      setOkCuadrillas(true);
      onSuccess?.();
      setTimeout(() => setOkCuadrillas(false), 3000);
    } catch (e) {
      setErrorCuadrillas(e?.response?.data?.message ?? 'Error guardando cuadrillas');
    } finally {
      setSavingCuadrillas(false);
    }
  };

  /* ── Registrar horas no trabajadas ────────────────────────── */
  const guardarHoras = async () => {
    setErrorHoras('');
    setOkHoras(false);

    const motivoFinal = horaForm.motivo === 'Otro' ? horaForm.motivoCustom.trim() : horaForm.motivo;

    if (!horaForm.cuadrillaId) return setErrorHoras('Selecciona una cuadrilla');
    if (!horaForm.fecha)       return setErrorHoras('Ingresa la fecha');
    if (!horaForm.horas || Number(horaForm.horas) <= 0) return setErrorHoras('Ingresa las horas (mayor a 0)');
    if (!motivoFinal)          return setErrorHoras('Ingresa el motivo');

    setSavingHoras(true);
    try {
      await registrarHorasNoTrabajadas({
        subproyectoId: subproyecto._id,
        cuadrillaId:   horaForm.cuadrillaId,
        fecha:         horaForm.fecha,
        horas:         Number(horaForm.horas),
        motivo:        motivoFinal,
      });
      setOkHoras(true);
      setHoraForm({ cuadrillaId: '', fecha: '', horas: '', motivo: '', motivoCustom: '' });
      onSuccess?.();
      // Recargar historial
      const res = await httpClient.get('/horas-no-trabajadas/mensual', {
        params: {
          subproyectoId: subproyecto._id,
          mes: new Date().getMonth() + 1,
          anio: new Date().getFullYear(),
        },
      });
      setHistorial(res?.data ?? []);
      setTimeout(() => setOkHoras(false), 3000);
    } catch (e) {
      setErrorHoras(e?.response?.data?.error ?? e?.response?.data?.message ?? 'Error registrando horas');
    } finally {
      setSavingHoras(false);
    }
  };

  if (!isOpen || !subproyecto) return null;

  const cuadrillasSub = (subproyecto.cuadrillas ?? []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        width: 'min(680px, 100%)',
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #e6e8ef',
        boxShadow: '0 32px 80px rgba(15,23,42,0.24)',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{
          padding: '18px 22px 0',
          borderBottom: '1px solid #f0f2f5',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(31,143,87,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ChevronRight size={18} color="#1f8f57" />
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  Gestionar Subproyecto
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', paddingLeft: 46 }}>
                <strong style={{ color: '#0f172a' }}>{subproyecto.codigo}</strong> · {subproyecto.nombre}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9', border: 'none',
                width: 32, height: 32, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748b', fontSize: 18,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            <Tab
              active={tab === 'cuadrillas'}
              onClick={() => setTab('cuadrillas')}
              icon={<Users size={15} />}
              label="Cuadrillas"
              count={cuadrillasSel.length}
            />
            <Tab
              active={tab === 'horas'}
              onClick={() => setTab('horas')}
              icon={<Clock size={15} />}
              label="Horas no trabajadas"
            />
          </div>
        </div>

        {/* ── Contenido ────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>

          {/* ════ TAB CUADRILLAS ════ */}
          {tab === 'cuadrillas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Selecciona las cuadrillas que trabajarán en este subproyecto. Los cambios se guardan con el botón de abajo.
              </p>

              {loadingCuadrillas ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>
                  Cargando cuadrillas...
                </div>
              ) : todasCuadrillas.length === 0 ? (
                <div style={{
                  padding: '20px 16px', background: '#fef9c3',
                  border: '1px solid #fde68a', borderRadius: 12,
                  color: '#92400e', fontSize: 13,
                  display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <AlertCircle size={15} />
                  No hay cuadrillas registradas en el sistema.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 10,
                }}>
                  {todasCuadrillas.map(c => {
                    const sel = cuadrillasSel.includes(c._id);
                    return (
                      <div
                        key={c._id}
                        onClick={() => {
                          setErrorCuadrillas('');
                          setOkCuadrillas(false);
                          setCuadrillasSel(prev =>
                            sel ? prev.filter(id => id !== c._id) : [...prev, c._id]
                          );
                        }}
                        style={{
                          padding: '12px 14px',
                          border: `1.5px solid ${sel ? '#1f8f57' : '#e6e8ef'}`,
                          background: sel ? '#f0faf4' : '#fff',
                          borderRadius: 12,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}
                      >
                        {/* Checkbox visual */}
                        <div style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                          border: `2px solid ${sel ? '#1f8f57' : '#cbd5e1'}`,
                          background: sel ? '#1f8f57' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {sel && <CheckCircle2 size={11} color="#fff" strokeWidth={3} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {c.nombre}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            {c.codigo}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Feedback */}
              {errorCuadrillas && (
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 10, padding: '10px 14px',
                  fontSize: 13, color: '#dc2626',
                }}>
                  <AlertCircle size={14} /> {errorCuadrillas}
                </div>
              )}
              {okCuadrillas && (
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  background: '#f0faf4', border: '1px solid #bbf7d0',
                  borderRadius: 10, padding: '10px 14px',
                  fontSize: 13, color: '#1f8f57',
                }}>
                  <CheckCircle2 size={14} /> Cuadrillas guardadas correctamente
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={guardarCuadrillas}
                  disabled={savingCuadrillas}
                  style={{
                    background: savingCuadrillas ? '#94a3b8' : '#1f8f57',
                    color: '#fff', border: 'none',
                    padding: '11px 24px', borderRadius: 10,
                    fontWeight: 700, fontSize: 14,
                    cursor: savingCuadrillas ? 'not-allowed' : 'pointer',
                    boxShadow: savingCuadrillas ? 'none' : '0 4px 12px rgba(31,143,87,0.25)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {savingCuadrillas ? 'Guardando...' : (
                    <><CheckCircle2 size={15} /> Guardar cuadrillas</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ════ TAB HORAS ════ */}
          {tab === 'horas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Sin cuadrillas asignadas */}
              {cuadrillasSub.length === 0 ? (
                <div style={{
                  padding: '20px 16px', background: '#fef9c3',
                  border: '1px solid #fde68a', borderRadius: 12,
                  color: '#92400e', fontSize: 13,
                  display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <AlertCircle size={15} />
                  Este subproyecto no tiene cuadrillas asignadas. Asígnalas primero en la pestaña <strong>Cuadrillas</strong>.
                </div>
              ) : (
                <>
                  {/* Formulario */}
                  <div style={{
                    background: '#f8fafc', border: '1px solid #e6e8ef',
                    borderRadius: 14, padding: '16px 18px',
                    display: 'flex', flexDirection: 'column', gap: 14,
                  }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      📋 Registrar horas no trabajadas
                    </p>

                    {/* Cuadrilla */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Cuadrilla *
                      </label>
                      <select
                        value={horaForm.cuadrillaId}
                        onChange={e => setHoraForm(p => ({ ...p, cuadrillaId: e.target.value }))}
                        style={{
                          width: '100%', padding: '9px 12px',
                          border: '1.5px solid #e6e8ef', borderRadius: 10,
                          fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none',
                        }}
                      >
                        <option value="">— Seleccione cuadrilla —</option>
                        {cuadrillasSub.map(c => (
                          <option key={c._id ?? c} value={c._id ?? c}>
                            {c.nombre ?? c.codigo ?? c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fecha y Horas en fila */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Fecha *
                        </label>
                        <input
                          type="date"
                          value={horaForm.fecha}
                          max={new Date().toISOString().slice(0, 10)}
                          onChange={e => setHoraForm(p => ({ ...p, fecha: e.target.value }))}
                          style={{
                            width: '100%', padding: '9px 12px',
                            border: '1.5px solid #e6e8ef', borderRadius: 10,
                            fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Horas *
                        </label>
                        <input
                          type="number"
                          min={0.5}
                          max={24}
                          step={0.5}
                          placeholder="Ej: 4"
                          value={horaForm.horas}
                          onChange={e => setHoraForm(p => ({ ...p, horas: e.target.value }))}
                          style={{
                            width: '100%', padding: '9px 12px',
                            border: '1.5px solid #e6e8ef', borderRadius: 10,
                            fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    {/* Motivo */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Motivo *
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: horaForm.motivo === 'Otro' ? 10 : 0 }}>
                        {MOTIVOS.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setHoraForm(p => ({ ...p, motivo: m, motivoCustom: '' }))}
                            style={{
                              padding: '6px 14px', borderRadius: 999,
                              border: `1.5px solid ${horaForm.motivo === m ? '#1f8f57' : '#e6e8ef'}`,
                              background: horaForm.motivo === m ? '#f0faf4' : '#fff',
                              color: horaForm.motivo === m ? '#1f8f57' : '#475569',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      {horaForm.motivo === 'Otro' && (
                        <input
                          type="text"
                          placeholder="Describe el motivo..."
                          value={horaForm.motivoCustom}
                          onChange={e => setHoraForm(p => ({ ...p, motivoCustom: e.target.value }))}
                          style={{
                            width: '100%', padding: '9px 12px',
                            border: '1.5px solid #e6e8ef', borderRadius: 10,
                            fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      )}
                    </div>

                    {/* Feedback */}
                    {errorHoras && (
                      <div style={{
                        display: 'flex', gap: 8, alignItems: 'center',
                        background: '#fef2f2', border: '1px solid #fecaca',
                        borderRadius: 10, padding: '10px 14px',
                        fontSize: 13, color: '#dc2626',
                      }}>
                        <AlertCircle size={14} /> {errorHoras}
                      </div>
                    )}
                    {okHoras && (
                      <div style={{
                        display: 'flex', gap: 8, alignItems: 'center',
                        background: '#f0faf4', border: '1px solid #bbf7d0',
                        borderRadius: 10, padding: '10px 14px',
                        fontSize: 13, color: '#1f8f57',
                      }}>
                        <CheckCircle2 size={14} /> Horas registradas correctamente
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={guardarHoras}
                        disabled={savingHoras}
                        style={{
                          background: savingHoras ? '#94a3b8' : '#dc2626',
                          color: '#fff', border: 'none',
                          padding: '10px 22px', borderRadius: 10,
                          fontWeight: 700, fontSize: 13,
                          cursor: savingHoras ? 'not-allowed' : 'pointer',
                          boxShadow: savingHoras ? 'none' : '0 4px 12px rgba(220,38,38,0.22)',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                      >
                        {savingHoras ? 'Registrando...' : (
                          <><Plus size={14} /> Registrar horas</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Historial del mes */}
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      📊 Resumen del mes actual por cuadrilla
                    </p>

                    {loadingHistorial ? (
                      <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>
                        Cargando historial...
                      </div>
                    ) : historial.length === 0 ? (
                      <div style={{
                        textAlign: 'center', padding: '20px',
                        background: '#f8fafc', border: '2px dashed #e2e8f0',
                        borderRadius: 12, color: '#94a3b8', fontSize: 13,
                      }}>
                        No hay registros este mes
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {historial.map((h, i) => {
                          const cuadrilla = cuadrillasSub.find(c => (c._id ?? c) === (h._id ?? h.cuadrillaId));
                          return (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: '#fff', border: '1px solid #e6e8ef', borderRadius: 10,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 8,
                                  background: '#fee2e2',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <Clock size={15} color="#dc2626" />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                  {cuadrilla?.nombre ?? `Cuadrilla ${i + 1}`}
                                </span>
                              </div>
                              <Badge color="#dc2626" bg="#fee2e2">
                                🚫 {h.totalHoras ?? h.horas_no_trabajadas ?? 0}h no trabajadas
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionarSubproyectoModal;