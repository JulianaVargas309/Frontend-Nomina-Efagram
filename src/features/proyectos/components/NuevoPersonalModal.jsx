import { useEffect, useReducer, useRef, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import httpClient from '../../../core/api/httpClient';

const CARGOS = ['Operario', 'Supervisor', 'Auxiliar', 'Capataz', 'Jefe de Campo'];
const TIPOS_CONTRATO = ['INDEFINIDO', 'FIJO', 'OBRA_LABOR', 'APRENDIZ', 'TEMPORAL'];

const normalizeList = (axiosRes) => {
  const body = axiosRes?.data ?? axiosRes;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

const INITIAL_STATE = {
  numDoc: '',
  nombres: '',
  segundoNombre: '',
  apellidos: '',
  segundoApellido: '',
  cargo: '',
  tipoContrato: 'OBRA_LABOR',
  fechaIngreso: '',
  fincaId: '',
  procesoId: '',
  supervisorId: '',
  estado: 'ACTIVO',
  saving: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return { ...INITIAL_STATE, ...action.values };
    case 'SET_SAVING':
      return { ...state, saving: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.value };
    default:
      return state;
  }
}

const formatIsoToDisplay = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const formatDisplayToIso = (value) => {
  const raw = String(value || '').replace(/[^0-9]/g, '').slice(0, 8);

  let display = raw;
  if (raw.length > 4) {
    display = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
  } else if (raw.length > 2) {
    display = `${raw.slice(0, 2)}/${raw.slice(2)}`;
  }

  if (raw.length !== 8) {
    return { display, iso: '' };
  }

  const d = parseInt(raw.slice(0, 2), 10);
  const m = parseInt(raw.slice(2, 4), 10);
  const y = parseInt(raw.slice(4, 8), 10);

  const fecha = new Date(y, m - 1, d);
  const valida =
    fecha.getFullYear() === y &&
    fecha.getMonth() === m - 1 &&
    fecha.getDate() === d &&
    m >= 1 &&
    m <= 12 &&
    d >= 1 &&
    d <= 31;

  if (!valida) {
    return { display, iso: '' };
  }

  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const yy = String(y);

  return {
    display,
    iso: `${yy}-${mm}-${dd}`,
  };
};

export default function NuevoPersonalModal({
  isOpen,
  title = 'Nuevo Personal',
  initialValues,
  onClose,
  onSubmit,
}) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [displayFechaIngreso, setDisplayFechaIngreso] = useState('');

  const [fincas, setFincas] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [supervisores, setSupervisores] = useState([]);

  const fechaIngresoPickerRef = useRef(null);

  const setField = (field) => (e) =>
    dispatch({ type: 'SET_FIELD', field, value: e.target.value });

  useEffect(() => {
    if (!isOpen) return;

    Promise.all([
      httpClient.get('/fincas').catch(() => ({ data: [] })),
      httpClient.get('/procesos').catch(() => ({ data: [] })),
      httpClient.get('/personas').catch(() => ({ data: [] })),
    ]).then(([fRes, pRes, sRes]) => {
      setFincas(normalizeList(fRes?.data ?? fRes));
      setProcesos(normalizeList(pRes?.data ?? pRes));
      const todas = normalizeList(sRes?.data ?? sRes);
      setSupervisores(
        todas.filter(
          (p) => p?.cargo?.toLowerCase().includes('supervisor') && p?.estado === 'ACTIVO'
        )
      );
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const f = initialValues?.finca;
    const pr = initialValues?.proceso;
    const sup = initialValues?.supervisor;

    dispatch({
      type: 'RESET',
      values: {
        numDoc: initialValues?.num_doc ?? '',
        nombres: initialValues?.nombres ?? '',
        segundoNombre: initialValues?.segundo_nombre ?? '',
        apellidos: initialValues?.apellidos ?? '',
        segundoApellido: initialValues?.segundo_apellido ?? '',
        cargo: initialValues?.cargo ?? '',
        tipoContrato: initialValues?.tipo_contrato ?? 'OBRA_LABOR',
        fechaIngreso: initialValues?.fecha_ingreso
          ? initialValues.fecha_ingreso.substring(0, 10)
          : '',
        fincaId: typeof f === 'string' ? f : (f?._id ?? f?.id ?? ''),
        procesoId: typeof pr === 'string' ? pr : (pr?._id ?? pr?.id ?? ''),
        supervisorId: typeof sup === 'string' ? sup : (sup?._id ?? sup?.id ?? ''),
        estado: initialValues?.estado ?? 'ACTIVO',
        saving: false,
        error: null,
      },
    });

    if (initialValues?.fecha_ingreso) {
      const iso = initialValues.fecha_ingreso.substring(0, 10);
      setDisplayFechaIngreso(formatIsoToDisplay(iso));
    } else {
      setDisplayFechaIngreso('');
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const isEdit = title.toLowerCase().includes('editar');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_ERROR', value: null });

    if (!state.numDoc.trim() || !state.nombres.trim() || !state.apellidos.trim()) {
      dispatch({
        type: 'SET_ERROR',
        value: 'Cédula, primer nombre y primer apellido son obligatorios',
      });
      return;
    }

    const payload = {
      tipo_doc: 'CC',
      num_doc: state.numDoc.trim(),
      nombres: state.nombres.trim(),
      segundo_nombre: state.segundoNombre.trim() || undefined,
      apellidos: state.apellidos.trim(),
      segundo_apellido: state.segundoApellido.trim() || undefined,
      cargo: state.cargo,
      tipo_contrato: state.tipoContrato,
      fecha_ingreso: state.fechaIngreso || undefined,
      finca: state.fincaId || undefined,
      proceso: state.procesoId || undefined,
      supervisor: state.supervisorId || undefined,
      estado: state.estado,
    };

    try {
      dispatch({ type: 'SET_SAVING', value: true });
      await onSubmit?.(payload);
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        value: err?.response?.data?.message || 'No se pudo guardar',
      });
      dispatch({ type: 'SET_SAVING', value: false });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            <p className="modal-subtitle">Completa los datos del personal</p>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <label className="field">
            <span>Cédula *</span>
            <input
              value={state.numDoc}
              onChange={setField('numDoc')}
              placeholder="Ej: 1061234567"
              autoFocus
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="field">
              <span>Primer Nombre *</span>
              <input value={state.nombres} onChange={setField('nombres')} placeholder="Ej: Juan" />
            </label>
            <label className="field">
              <span>Segundo Nombre</span>
              <input
                value={state.segundoNombre}
                onChange={setField('segundoNombre')}
                placeholder="Ej: Carlos"
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="field">
              <span>Primer Apellido *</span>
              <input
                value={state.apellidos}
                onChange={setField('apellidos')}
                placeholder="Ej: Pérez"
              />
            </label>
            <label className="field">
              <span>Segundo Apellido</span>
              <input
                value={state.segundoApellido}
                onChange={setField('segundoApellido')}
                placeholder="Ej: Gómez"
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="field">
              <span>Cargo</span>
              <select value={state.cargo} onChange={setField('cargo')}>
                <option value="">— Selecciona cargo —</option>
                {CARGOS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Tipo Contrato</span>
              <select value={state.tipoContrato} onChange={setField('tipoContrato')}>
                {TIPOS_CONTRATO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="field">
              <span>Fecha Ingreso</span>

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  style={{ letterSpacing: 1, paddingRight: 44 }}
                  value={displayFechaIngreso}
                  onChange={(e) => {
                    const { display, iso } = formatDisplayToIso(e.target.value);
                    setDisplayFechaIngreso(display);
                    dispatch({ type: 'SET_FIELD', field: 'fechaIngreso', value: iso });
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    if (fechaIngresoPickerRef.current?.showPicker) {
                      fechaIngresoPickerRef.current.showPicker();
                    } else {
                      fechaIngresoPickerRef.current?.focus();
                    }
                  }}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#6366f1',
                    transition: 'all .2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#eef2ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                  title="Seleccionar fecha de ingreso"
                >
                  <CalendarDays size={16} />
                </button>

                <input
                  ref={fechaIngresoPickerRef}
                  type="date"
                  value={state.fechaIngreso || ''}
                  onChange={(e) => {
                    const iso = e.target.value;
                    dispatch({ type: 'SET_FIELD', field: 'fechaIngreso', value: iso });
                    setDisplayFechaIngreso(formatIsoToDisplay(iso));
                  }}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    width: 0,
                    height: 0,
                  }}
                  tabIndex={-1}
                />
              </div>

              {displayFechaIngreso.length === 10 && !state.fechaIngreso && (
                <small style={{ color: '#dc2626', fontSize: 11, marginTop: 2 }}>
                  Fecha inválida — verifica día, mes y año
                </small>
              )}
            </label>

            <label className="field">
              <span>Estado</span>
              <select value={state.estado} onChange={setField('estado')}>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="SUSPENDIDO">Suspendido</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Finca</span>
            <select value={state.fincaId} onChange={setField('fincaId')}>
              <option value="">— Sin finca asignada —</option>
              {fincas.map((f) => (
                <option key={f._id ?? f.id} value={f._id ?? f.id}>
                  {f.codigo ? `${f.codigo} – ` : ''}
                  {f.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Proceso</span>
            <select value={state.procesoId} onChange={setField('procesoId')}>
              <option value="">— Sin proceso asignado —</option>
              {procesos.map((p) => (
                <option key={p._id ?? p.id} value={p._id ?? p.id}>
                  {p.codigo ? `${p.codigo} – ` : ''}
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Supervisor</span>
            <select value={state.supervisorId} onChange={setField('supervisorId')}>
              <option value="">— Sin supervisor —</option>
              {supervisores.map((s) => (
                <option key={s._id ?? s.id} value={s._id ?? s.id}>
                  {s.nombres} {s.apellidos}
                </option>
              ))}
            </select>
          </label>

          {state.error && <div className="form-error">{state.error}</div>}

          <div className="modal-actions">
            <button className="btn-modal-cancel" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn-modal-submit" type="submit" disabled={state.saving}>
              {state.saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}