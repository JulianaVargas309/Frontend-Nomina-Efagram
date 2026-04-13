// ==========================================
// MODAL: CREAR PROGRAMACIÓN — VERSIÓN FINAL
// ==========================================

import { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, MapPin, Layers, Wrench, Calendar, Hash, DollarSign, CalendarDays, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

const getMensajeError = (err) => {
  if (!err) return 'Error desconocido';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  if (err.error) return err.error;
  if (Array.isArray(err.errors) && err.errors[0]?.message) return err.errors[0].message;
  return 'Error al crear programación';
};

/* ─── Calendario profesional integrado ─────────────────────────────────── */
const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const DIAS_CORTOS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

function CalendarioPicker({ value, onChange, disabled }) {
  const hoy = new Date();
  const selDate = value ? new Date(value + 'T12:00:00') : null;

  const [vistaAnio, setVistaAnio] = useState(selDate ? selDate.getFullYear() : hoy.getFullYear());
  const [vistaMes,  setVistaMes]  = useState(selDate ? selDate.getMonth()    : hoy.getMonth());
  const [abierto,   setAbierto]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const irMesAnterior = () => {
    if (vistaMes === 0) { setVistaMes(11); setVistaAnio(y => y - 1); }
    else setVistaMes(m => m - 1);
  };
  const irMesSiguiente = () => {
    if (vistaMes === 11) { setVistaMes(0); setVistaAnio(y => y + 1); }
    else setVistaMes(m => m + 1);
  };

  const primerDia = new Date(vistaAnio, vistaMes, 1).getDay();
  const offset = primerDia === 0 ? 6 : primerDia - 1;
  const diasEnMes = new Date(vistaAnio, vistaMes + 1, 0).getDate();

  const celdas = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  const esSeleccionado = (d) => {
    if (!d || !selDate) return false;
    return selDate.getFullYear() === vistaAnio && selDate.getMonth() === vistaMes && selDate.getDate() === d;
  };
  const esHoy = (d) => {
    if (!d) return false;
    return hoy.getFullYear() === vistaAnio && hoy.getMonth() === vistaMes && hoy.getDate() === d;
  };

  const seleccionarDia = (d) => {
    if (!d || disabled) return;
    const mm = String(vistaMes + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onChange(`${vistaAnio}-${mm}-${dd}`);
    setAbierto(false);
  };

  const labelBoton = selDate
    ? `${String(selDate.getDate()).padStart(2,'0')}/${String(selDate.getMonth()+1).padStart(2,'0')}/${selDate.getFullYear()}`
    : 'DD/MM/AAAA';

  const s = {
    wrap:    { position: 'relative', width: '100%' },
    trigger: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db',
      borderRadius: 8, background: disabled ? '#f1f5f9' : '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 14, color: selDate ? '#0f172a' : '#94a3b8',
      fontFamily: 'inherit', boxSizing: 'border-box',
      transition: 'border-color 0.15s', letterSpacing: selDate ? 0 : 1,
    },
    popup: {
      position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 9999,
      background: '#fff', borderRadius: 14, padding: '16px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb', width: 280, userSelect: 'none',
    },
    navRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    navBtn: {
      width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e7eb',
      background: '#f9fafb', display: 'flex', alignItems: 'center',
      justifyContent: 'center', cursor: 'pointer', color: '#374151',
      transition: 'background 0.12s',
    },
    mesLabel: { fontWeight: 700, fontSize: 15, color: '#111827' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
    diaHeader: { textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', padding: '4px 0', letterSpacing: '0.02em' },
    celda: (d, sel, hoyFlag) => ({
      width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center',
      justifyContent: 'center', borderRadius: 8, fontSize: 13, cursor: d ? 'pointer' : 'default',
      fontWeight: sel ? 700 : hoyFlag ? 600 : 400,
      background: sel ? '#16a34a' : hoyFlag ? '#f0fdf4' : 'transparent',
      color: sel ? '#fff' : hoyFlag ? '#16a34a' : d ? '#111827' : 'transparent',
      border: hoyFlag && !sel ? '1.5px solid #86efac' : '1.5px solid transparent',
      transition: 'background 0.12s',
    }),
    footerRow: { marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    btnHoy: {
      fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#f0fdf4',
      border: '1px solid #86efac', borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
    },
    btnLimpiar: {
      fontSize: 12, fontWeight: 500, color: '#6b7280', background: 'none',
      border: 'none', cursor: 'pointer', padding: '4px 6px',
    },
  };

  return (
    <div ref={ref} style={s.wrap}>
      <button
        type="button"
        style={s.trigger}
        disabled={disabled}
        onClick={() => !disabled && setAbierto(a => !a)}
        onFocus={e => { if (!disabled) e.currentTarget.style.borderColor = '#16a34a'; }}
        onBlur={e  => { e.currentTarget.style.borderColor = '#d1d5db'; }}
      >
        <span>{labelBoton}</span>
        <Calendar size={14} color="#6b7280" />
      </button>

      {abierto && (
        <div style={s.popup}>
          <div style={s.navRow}>
            <button type="button" style={s.navBtn} onClick={irMesAnterior}>
              <ChevronLeft size={14} />
            </button>
            <span style={s.mesLabel}>{MESES[vistaMes]} {vistaAnio}</span>
            <button type="button" style={s.navBtn} onClick={irMesSiguiente}>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={s.grid}>
            {DIAS_CORTOS.map(d => (
              <div key={d} style={s.diaHeader}>{d}</div>
            ))}
            {celdas.map((d, i) => {
              const sel  = esSeleccionado(d);
              const hoyF = esHoy(d);
              return (
                <div
                  key={i}
                  style={s.celda(d, sel, hoyF)}
                  onClick={() => seleccionarDia(d)}
                  onMouseEnter={e => { if (d && !sel) e.currentTarget.style.background = '#f0fdf4'; }}
                  onMouseLeave={e => { if (d && !sel) e.currentTarget.style.background = 'transparent'; }}
                >
                  {d ?? ''}
                </div>
              );
            })}
          </div>

          <div style={s.footerRow}>
            <button type="button" style={s.btnHoy} onClick={() => {
              const h = new Date();
              const iso = `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}-${String(h.getDate()).padStart(2,'0')}`;
              onChange(iso);
              setAbierto(false);
            }}>
              Hoy
            </button>
            <button type="button" style={s.btnLimpiar} onClick={() => { onChange(''); setAbierto(false); }}>
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Modal principal ───────────────────────────────────────────────────── */
export default function ModalCrearProgramacion({ isOpen, onClose, onSave }) {
  const [contratos,            setContratos]            = useState([]);
  const [contratoSeleccionado, setContratoSeleccionado] = useState('');
  const [infoContrato,         setInfoContrato]         = useState(null);
  const [fechaInicial,         setFechaInicial]         = useState('');
  const [cantidadProyectada,   setCantidadProyectada]   = useState('');
  const [valorProyectado,      setValorProyectado]      = useState('');
  const [observaciones,        setObservaciones]        = useState('');
  const [loading,              setLoading]              = useState(true);
  const [guardando,            setGuardando]            = useState(false);
  const [error,                setError]                = useState(null);

  useEffect(() => {
    if (isOpen) {
      setContratoSeleccionado('');
      setInfoContrato(null);
      setFechaInicial('');
      setCantidadProyectada('');
      setValorProyectado('');
      setObservaciones('');
      setError(null);
      cargarContratos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const cargarContratos = async () => {
    try {
      setLoading(true);
      setError(null);
      const { getContratos } = await import('../../contratos/services/contratosService');
      const response = await getContratos();
      const lista =
        Array.isArray(response?.data) ? response.data :
          Array.isArray(response?.data?.data) ? response.data.data :
            Array.isArray(response) ? response : [];
      const activos = lista.filter(c => c.estado === 'ACTIVO');
      setContratos(activos);
    } catch (err) {
      setError('Error al cargar contratos: ' + getMensajeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleContratoChange = (id) => {
    setContratoSeleccionado(id);
    setError(null);
    if (!id) { setInfoContrato(null); return; }
    const c = contratos.find(x => x._id === id);
    setInfoContrato(c || null);
  };

  const handleGuardar = async () => {
    setError(null);
    if (!contratoSeleccionado) { setError('Selecciona un contrato'); return; }
    if (!fechaInicial) { setError('Selecciona la fecha inicial'); return; }
    const cantNum = Number(cantidadProyectada);
    if (!cantidadProyectada || isNaN(cantNum) || cantNum <= 0) {
      setError('Ingresa la cantidad proyectada (mayor a 0)');
      return;
    }
    try {
      setGuardando(true);
      const fechaISO = new Date(fechaInicial + 'T12:00:00.000Z').toISOString();
      const datos = {
        contrato_id: contratoSeleccionado,
        fecha_inicial: fechaISO,
        cantidad_proyectada: cantNum,
        valor_proyectado: Number(valorProyectado) || 0,
        observaciones: observaciones.trim(),
      };
      await onSave(datos);
    } catch (err) {
      setError(getMensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const fechaFinDisplay = fechaInicial
    ? (() => {
      const d = new Date(fechaInicial + 'T12:00:00Z');
      d.setDate(d.getDate() + 6);
      return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    })()
    : '—';

  if (!isOpen) return null;

  const inputSt = {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid #d1d5db', borderRadius: 8,
    fontSize: 14, color: '#0f172a', background: '#fff',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const labelSt = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: '#374151', marginBottom: 4,
  };
  const chipSt = {
    display: 'inline-block', background: '#f1f5f9',
    border: '1px solid #e2e8f0', borderRadius: 6,
    padding: '3px 10px', fontSize: 12, color: '#334155',
    fontWeight: 500, marginRight: 4, marginBottom: 4,
  };

  const isDisabled = guardando || loading || !contratoSeleccionado || !fechaInicial || !cantidadProyectada;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(600px, calc(100% - 24px))',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 24px 64px rgba(15,23,42,0.25)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '92vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: '#fff', zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
            }}>
              <CalendarDays size={20} color="white" strokeWidth={2} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                Nueva Programación
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>
                Crea una programación semanal de ejecución (7 días)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#e5e7eb', border: '1.5px solid #d1d5db', borderRadius: 8,
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, marginLeft: 12,
              fontSize: 18, fontWeight: 700, color: '#374151', lineHeight: 1,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* ERROR */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              padding: '10px 12px', marginBottom: 14,
            }}>
              <AlertCircle size={15} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
            </div>
          )}

          {/* CONTRATO */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>
              Contrato *{' '}
              <span style={{ color: '#94a3b8', fontWeight: 400 }}>(contratos activos)</span>
            </label>
            {loading ? (
              <div style={{ padding: 10, color: '#64748b', fontSize: 13 }}>
                ⏳ Cargando contratos...
              </div>
            ) : contratos.length === 0 ? (
              <div style={{ padding: 10, color: '#dc2626', fontSize: 13, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                ⚠️ No hay contratos en estado ACTIVO.
              </div>
            ) : (
              <select
                style={inputSt}
                value={contratoSeleccionado}
                onChange={e => handleContratoChange(e.target.value)}
                disabled={guardando}
              >
                <option value="">— Selecciona un contrato —</option>
                {contratos.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.codigo} · {c.finca?.nombre || 'Sin finca'}
                    {c.subproyecto?.nombre ? ` · ${c.subproyecto.nombre}` : ''}
                    {c.cuadrillas?.length > 0 ? ` · ${c.cuadrillas[0]?.nombre || ''}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* INFO CONTRATO */}
          {infoContrato && (
            <div style={{ background: '#f8fafc', border: '1px solid #e6e8ef', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ClipboardList size={15} color="#2563eb" strokeWidth={2} />
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#374151' }}>
                  Información del Contrato
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <MapPin size={14} color="#64748b" style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Finca: </span>
                  <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>
                    {infoContrato.finca?.nombre || '—'}
                    {infoContrato.finca?.codigo ? ` (${infoContrato.finca.codigo})` : ''}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <Layers size={14} color="#64748b" style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Lotes: </span>
                  {(infoContrato.lotes || []).map((l, idx) => (
                    <span key={l?._id || idx} style={chipSt}>{l?.nombre || l?.codigo || `Lote ${idx + 1}`}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Wrench size={14} color="#64748b" style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Actividades: </span>
                  {(infoContrato.actividades || []).map((a, idx) => {
                    const act = a?.actividad;
                    const label = act?.nombre || act?.codigo || `Actividad ${idx + 1}`;
                    const key = act?._id || idx;
                    return <span key={key} style={chipSt}>{label}</span>;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* FECHAS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px', marginBottom: 14 }}>
            <div>
              <label style={labelSt}>
                <Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Fecha Inicial *
              </label>
              {/* ✅ CALENDARIO PROPIO — reemplaza el input manual DD/MM/AAAA */}
              <CalendarioPicker
                value={fechaInicial}
                onChange={setFechaInicial}
                disabled={guardando}
              />
            </div>
            <div>
              <label style={labelSt}>
                <Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Fecha Final (calculada)
              </label>
              <div style={{ ...inputSt, background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                {fechaFinDisplay}
              </div>
              <small style={{ color: '#94a3b8', fontSize: 11, marginTop: 2, display: 'block' }}>
                Inicio + 6 días = 7 días de semana
              </small>
            </div>
          </div>

          {/* PROYECTADO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px', marginBottom: 14 }}>
            <div>
              <label style={labelSt}>
                <Hash size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Cantidad Proyectada *
              </label>
              <input type="number" min="0.01" step="0.01" style={inputSt}
                placeholder="Ej: 2.5" value={cantidadProyectada}
                onChange={e => setCantidadProyectada(e.target.value)} disabled={guardando} />
            </div>
            <div>
              <label style={labelSt}>
                <DollarSign size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Valor Proyectado ($)
              </label>
              <input type="number" min="0" step="1" style={inputSt}
                placeholder="Ej: 800000" value={valorProyectado}
                onChange={e => setValorProyectado(e.target.value)} disabled={guardando} />
            </div>
          </div>

          {/* OBSERVACIONES */}
          <div>
            <label style={labelSt}>Observaciones</label>
            <textarea style={{ ...inputSt, resize: 'vertical' }} rows={3}
              placeholder="Notas adicionales..." value={observaciones}
              onChange={e => setObservaciones(e.target.value)} disabled={guardando} />
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          position: 'sticky', bottom: 0, background: '#fff',
        }}>
          <button onClick={onClose} disabled={guardando}
            style={{ background: '#f9fafb', color: '#374151', border: '1px solid #d1d5db', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={isDisabled}
            style={{ background: isDisabled ? '#9ca3af' : '#16a34a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: isDisabled ? 'not-allowed' : 'pointer', boxShadow: isDisabled ? 'none' : '0 4px 12px rgba(22,163,74,0.3)' }}>
            {guardando ? 'Creando...' : 'Crear Programación'}
          </button>
        </div>
      </div>
    </div>
  );
}