import { useEffect, useState, useRef, forwardRef } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';
const getToken = () => localStorage.getItem('efagram_token') ?? '';

const fetchJSON = async (url) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.data ?? [];
};

const TIPOS = [
  'PERMISO', 'AUSENCIA', 'INCAPACIDAD', 'ACCIDENTE_TRABAJO',
  'LLUVIA', 'INSUMOS', 'HERRAMIENTAS', 'SUSPENSION',
  'VACACIONES', 'LICENCIA', 'OTRO',
];

const MENSAJES_CAMPO = {
  fecha: 'La fecha es obligatoria y debe tener formato válido.',
  trabajador: 'Debes seleccionar un trabajador.',
  tipo: 'El tipo de novedad es obligatorio.',
  descripcion: 'La descripción es obligatoria.',
  dias: 'El número de días debe ser un valor válido.',
  estado: 'El estado es obligatorio.',
  afecta_nomina: 'El campo "Afecta nómina" es obligatorio.',
  requiere_aprobacion: 'El campo "Requiere aprobación" es obligatorio.',
};

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const DIAS_CORTOS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

/* ─── Calendario profesional integrado ─────────────────────────────────── */
function CalendarioPicker({ value, onChange }) {
  const hoy = new Date();
  const selDate = value ? new Date(value + 'T12:00:00') : null;

  const [vistaAnio, setVistaAnio] = useState(selDate ? selDate.getFullYear() : hoy.getFullYear());
  const [vistaMes,  setVistaMes]  = useState(selDate ? selDate.getMonth()    : hoy.getMonth());
  const [abierto,   setAbierto]   = useState(false);
  const ref = useRef(null);

  /* cerrar al hacer click fuera */
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

  /* días del mes con offset (semana inicia lunes) */
  const primerDia = new Date(vistaAnio, vistaMes, 1).getDay(); // 0=Dom
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
    if (!d) return;
    const mm = String(vistaMes + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onChange(`${vistaAnio}-${mm}-${dd}`);
    setAbierto(false);
  };

  const labelBoton = selDate
    ? `${String(selDate.getDate()).padStart(2,'0')}/${String(selDate.getMonth()+1).padStart(2,'0')}/${selDate.getFullYear()}`
    : 'dd/mm/aaaa';

  /* ── estilos del picker (todos inline para no tocar CSS) ── */
  const s = {
    wrap:    { position: 'relative', width: '100%' },
    trigger: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
      borderRadius: 8, background: '#fff', cursor: 'pointer',
      fontSize: 14, color: selDate ? '#111827' : '#9ca3af',
      fontFamily: 'inherit', boxSizing: 'border-box',
      transition: 'border-color 0.15s',
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
      {/* Trigger */}
      <button
        type="button"
        style={s.trigger}
        onClick={() => setAbierto(a => !a)}
        onFocus={e => e.currentTarget.style.borderColor = '#16a34a'}
        onBlur={e  => e.currentTarget.style.borderColor = '#d1d5db'}
      >
        <span>{labelBoton}</span>
        <Calendar size={15} color="#6b7280" />
      </button>

      {/* Popup */}
      {abierto && (
        <div style={s.popup}>
          {/* Navegación mes/año */}
          <div style={s.navRow}>
            <button type="button" style={s.navBtn} onClick={irMesAnterior}>
              <ChevronLeft size={14} />
            </button>
            <span style={s.mesLabel}>{MESES[vistaMes]} {vistaAnio}</span>
            <button type="button" style={s.navBtn} onClick={irMesSiguiente}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Grid */}
          <div style={s.grid}>
            {DIAS_CORTOS.map(d => (
              <div key={d} style={s.diaHeader}>{d}</div>
            ))}
            {celdas.map((d, i) => {
              const sel   = esSeleccionado(d);
              const hoyF  = esHoy(d);
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

          {/* Footer */}
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
export default function NuevaNovedadModal({
  isOpen, title = 'Nueva Novedad', initialValues = {}, onClose, onSubmit,
}) {
  const [fecha,               setFecha]              = useState('');
  const [trabajador,          setTrabajador]          = useState('');
  const [tipo,                setTipo]                = useState('PERMISO');
  const [descripcion,         setDescripcion]         = useState('');
  const [dias,                setDias]                = useState('');
  const [afecta_nomina,       setAfectaNomina]        = useState(false);
  const [requiere_aprobacion, setRequiereAprobacion]  = useState(false);
  const [estado,              setEstado]              = useState('PENDIENTE');

  const [trabajadores, setTrabajadores] = useState([]);
  const [loadingData,  setLoadingData]  = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setFecha(initialValues?.fecha ? String(initialValues.fecha).slice(0, 10) : '');
    setTrabajador(initialValues?.trabajador?._id ?? initialValues?.trabajador ?? '');
    setTipo(initialValues?.tipo ?? 'PERMISO');
    setDescripcion(initialValues?.descripcion ?? '');
    setDias(String(initialValues?.dias ?? ''));
    setAfectaNomina(initialValues?.afecta_nomina ?? false);
    setRequiereAprobacion(initialValues?.requiere_aprobacion ?? false);
    setEstado(initialValues?.estado ?? 'PENDIENTE');
    setErrors([]);
    setSaving(false);

    setLoadingData(true);
    fetchJSON(`${BASE_URL}/personas`)
      .then((ts) => setTrabajadores(ts.filter((p) => p.estado === 'ACTIVO')))
      .catch((e) => console.error(e))
      .finally(() => setLoadingData(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const isEdit = title.toLowerCase().includes('editar');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    const locales = [];
    if (!fecha) locales.push('La fecha es obligatoria.');
    if (!trabajador) locales.push('Debes seleccionar un trabajador.');
    if (!descripcion.trim()) locales.push('La descripción es obligatoria.');
    if (locales.length > 0) return setErrors(locales);

    const payload = {
      fecha, trabajador, tipo,
      descripcion: descripcion.trim(),
      afecta_nomina, requiere_aprobacion, estado,
      ...(dias && { dias: Number(dias) }),
    };

    try {
      setSaving(true);
      await onSubmit?.(payload);
    } catch (err) {
      const backendErrors = err?.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        const mensajes = backendErrors.map((e) => {
          const campo = e.path ?? e.param ?? e.field ?? '';
          return MENSAJES_CAMPO[campo] ?? e.msg ?? e.message ?? `Campo inválido: ${campo}`;
        });
        setErrors(mensajes);
      } else {
        const msg = err?.response?.data?.message ?? err?.message ?? 'No se pudo guardar la novedad.';
        setErrors([msg]);
      }
      setSaving(false);
    }
  };

  const busy = saving || loadingData;

  return (
    <div className="nrm-backdrop">
      <div className="nrm-modal" role="dialog" aria-modal="true">

        <div className="nrm-header">
          <div>
            <h3 className="nrm-title">{title}</h3>
            <p className="nrm-subtitle">Completa los datos de la novedad</p>
          </div>
          <button className="nrm-close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="nrm-form" onSubmit={handleSubmit}>
          <div className="nrm-scroll-area">

            {/* ✅ FECHA — calendario propio, sin react-datepicker */}
            <div className="nrm-field">
              <label className="nrm-label">
                Fecha <span className="nrm-req">*</span>
              </label>
              <CalendarioPicker value={fecha} onChange={setFecha} />
            </div>

            <div className="nrm-field">
              <label className="nrm-label">Trabajador <span className="nrm-req">*</span></label>
              <select className="nrm-select" value={trabajador}
                onChange={(e) => setTrabajador(e.target.value)} disabled={loadingData}>
                <option value="">{loadingData ? 'Cargando...' : '-- Selecciona un trabajador --'}</option>
                {trabajadores.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.nombreCompleto ?? `${t.nombres ?? ''} ${t.apellidos ?? ''}`.trim()}
                  </option>
                ))}
              </select>
            </div>

            <div className="nrm-row">
              <div className="nrm-field">
                <label className="nrm-label">Tipo</label>
                <select className="nrm-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="nrm-field">
                <label className="nrm-label">Días <span className="nrm-opt">(opcional)</span></label>
                <input className="nrm-input" type="number" min="0" step="0.5"
                  value={dias} onChange={(e) => setDias(e.target.value)} placeholder="Ej: 0.5" />
              </div>
            </div>

            <div className="nrm-field">
              <label className="nrm-label">Descripción <span className="nrm-req">*</span></label>
              <textarea className="nrm-textarea" value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe la novedad..." rows={3} />
            </div>

            <div className="nrm-field">
              <label className="nrm-label">Estado</label>
              <select className="nrm-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="APROBADA">Aprobada</option>
                <option value="RECHAZADA">Rechazada</option>
              </select>
            </div>

            <div className="nrm-field">
              <label className="nrm-label">Opciones</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" checked={afecta_nomina}
                    onChange={(e) => setAfectaNomina(e.target.checked)} />
                  Afecta nómina
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" checked={requiere_aprobacion}
                    onChange={(e) => setRequiereAprobacion(e.target.checked)} />
                  Requiere aprobación
                </label>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="nrm-error">
                {errors.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6 }}>
                    <span>•</span>
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            )}

          </div>

          <div className="nrm-footer">
            <button className="btn-modal-cancel" type="button" onClick={onClose}>Cancelar</button>
            <button className="btn-modal-submit" type="submit" disabled={busy}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear novedad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}