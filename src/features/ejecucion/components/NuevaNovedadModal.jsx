import { useEffect, useRef, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { getCuadrillas } from '../../contratos/services/contratosService';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';
const getToken = () => localStorage.getItem('efagram_token') ?? '';

const fetchJSON = async (url) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.data ?? [];
};

const TIPOS = [
  'PERMISO',
  'AUSENCIA',
  'INCAPACIDAD',
  'ACCIDENTE_TRABAJO',
  'LLUVIA',
  'INSUMOS',
  'HERRAMIENTAS',
  'SUSPENSION',
  'VACACIONES',
  'LICENCIA',
  'OTRO',
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

const formatIsoToDisplay = (iso) => {
  if (!iso) return '';
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
};

const formatDisplayToDateParts = (value) => {
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

  const day = raw.slice(0, 2);
  const month = raw.slice(2, 4);
  const year = raw.slice(4, 8);

  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  const isValid =
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === Number(year) &&
    date.getMonth() + 1 === Number(month) &&
    date.getDate() === Number(day);

  return {
    display,
    iso: isValid ? `${year}-${month}-${day}` : '',
  };
};

export default function NuevaNovedadModal({
  isOpen, title = 'Nueva Novedad', initialValues = {}, onClose, onSubmit,
}) {
  const [fecha, setFecha] = useState('');
  const fechaPickerRef = useRef(null);
  const [fechaDisplay, setFechaDisplay] = useState('');
  const [trabajador, setTrabajador] = useState('');
  const [tipo, setTipo] = useState('PERMISO');
  const [descripcion, setDescripcion] = useState('');
  const [dias, setDias] = useState('');
  const [horas, setHoras] = useState('');
  const [cuadrilla, setCuadrilla] = useState('');
  const [afecta_nomina, setAfectaNomina] = useState(false);
  const [requiere_aprobacion, setRequiereAprobacion] = useState(false);
  const [estado, setEstado] = useState('PENDIENTE');

  const [trabajadores, setTrabajadores] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setFecha(initialValues?.fecha ? String(initialValues.fecha).slice(0, 10) : '');
    setTrabajador(initialValues?.trabajador?._id ?? initialValues?.trabajador ?? '');
    setTipo(initialValues?.tipo ?? 'PERMISO');
    setDescripcion(initialValues?.descripcion ?? '');
    setDias(String(initialValues?.dias ?? ''));
    setHoras(String(initialValues?.horas ?? ''));
    setCuadrilla(initialValues?.cuadrilla?._id ?? initialValues?.cuadrilla ?? '');
    setAfectaNomina(initialValues?.afecta_nomina ?? false);
    setRequiereAprobacion(initialValues?.requiere_aprobacion ?? false);
    setEstado(initialValues?.estado ?? 'PENDIENTE');
    setErrors([]);
    setSaving(false);

    setLoadingData(true);
    (async () => {
      try {
        const [ts, cuadData] = await Promise.all([
          fetchJSON(`${BASE_URL}/personas`),
          getCuadrillas(),
        ]);
        
        // Asegurar que ts es un array antes de hacer filter
        const trabajadoresList = Array.isArray(ts) ? ts : [];
        setTrabajadores(trabajadoresList.filter((p) => p.estado === 'ACTIVO'));
        
        // Normalizar respuesta de cuadrillas
        const cuadList = Array.isArray(cuadData) ? cuadData : 
                         Array.isArray(cuadData?.data) ? cuadData.data : [];
        setCuadrillas(cuadList);
      } catch (e) {
        console.error('Error cargando datos:', e);
        setTrabajadores([]);
        setCuadrillas([]);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const isEdit = title.toLowerCase().includes('editar');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    // Validación en el frontend
    const locales = [];
    if (!fecha) locales.push('La fecha es obligatoria.');
    if (!trabajador) locales.push('Debes seleccionar un trabajador.');
    if (!descripcion.trim()) locales.push('La descripción es obligatoria.');
    if (!horas || Number(horas) <= 0) locales.push('Las horas son obligatorias y deben ser mayores a 0.');
    if (!cuadrilla) locales.push('La cuadrilla es obligatoria.');
    if (locales.length > 0) return setErrors(locales);

    const payload = {
      fecha,
      trabajador,
      tipo,
      descripcion: descripcion.trim(),
      horas: Number(horas),
      cuadrilla,
      afecta_nomina,
      requiere_aprobacion,
      estado,
      ...(dias && { dias: Number(dias) }),
    };

    try {
      setSaving(true);
      await onSubmit?.(payload);
    } catch (err) {
      // Errores de validación del backend (array errors[])
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

            <div className="nrm-field">
              <label className="nrm-label">
                Fecha <span className="nrm-req">*</span>
              </label>

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <input
                  className="nrm-input"
                  type="text"
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  value={fechaDisplay}
                  onChange={(e) => {
                    const { display, iso } = formatDisplayToDateParts(e.target.value);
                    setFechaDisplay(display);
                    setFecha(iso);
                  }}
                  autoFocus
                  style={{ paddingRight: 44 }}
                />

                <button
                  type="button"
                  onClick={() => {
                    if (fechaPickerRef.current?.showPicker) {
                      fechaPickerRef.current.showPicker();
                    } else {
                      fechaPickerRef.current?.focus();
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
                  title="Seleccionar fecha"
                >
                  <CalendarDays size={16} />
                </button>

                <input
                  ref={fechaPickerRef}
                  type="date"
                  value={fecha || ''}
                  onChange={(e) => {
                    const iso = e.target.value;
                    setFecha(iso);
                    setFechaDisplay(formatIsoToDisplay(iso));
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

            <div className="nrm-row">
              <div className="nrm-field">
                <label className="nrm-label">Horas <span className="nrm-req">*</span></label>
                <input className="nrm-input" type="number" min="0" step="0.5"
                  value={horas} onChange={(e) => setHoras(e.target.value)} placeholder="Ej: 8" />
              </div>
              <div className="nrm-field">
                <label className="nrm-label">Cuadrilla <span className="nrm-req">*</span></label>
                <select className="nrm-select" value={cuadrilla}
                  onChange={(e) => setCuadrilla(e.target.value)} disabled={loadingData}>
                  <option value="">{loadingData ? 'Cargando...' : '-- Selecciona una cuadrilla --'}</option>
                  {cuadrillas.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nombre ?? `Cuadrilla ${c._id?.slice(-6)}`}
                    </option>
                  ))}
                </select>
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
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" checked={afecta_nomina}
                    onChange={(e) => setAfectaNomina(e.target.checked)} />
                  Afecta nómina
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" checked={requiere_aprobacion}
                    onChange={(e) => setRequiereAprobacion(e.target.checked)} />
                  Requiere aprobación
                </label>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="nrm-error">
                {errors.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ marginTop: 2, flexShrink: 0 }}>•</span>
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