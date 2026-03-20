import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const MENSAJES_CAMPO = {
  codigo:        'El código es obligatorio (ej: S07-2026).',
  fecha_inicio:  'La fecha de inicio es obligatoria.',
  fecha_fin:     'La fecha de fin es obligatoria.',
  año:           'El año es obligatorio.',
  numero_semana: 'El número de semana es obligatorio.',
  estado:        'El estado es obligatorio.',
  registros:     'El número de registros debe ser un valor válido.',
  cumplimiento:  'El cumplimiento debe ser un valor entre 0 y 100.',
  observaciones: 'Las observaciones no son válidas.',
};

export default function NuevaSemanaModal({
  isOpen, title = 'Nueva Semana', initialValues = {}, onClose, onSubmit,
}) {
  const [codigo,        setCodigo]        = useState('');
  const [fecha_inicio,  setFechaInicio]   = useState('');
  const [fecha_fin,     setFechaFin]      = useState('');
  const [estado,        setEstado]        = useState('ACTIVA');
  const [registros,     setRegistros]     = useState('');
  const [cumplimiento,  setCumplimiento]  = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setCodigo(initialValues?.codigo ?? initialValues?.semana ?? '');
    setFechaInicio(initialValues?.fecha_inicio ? String(initialValues.fecha_inicio).slice(0, 10) : '');
    setFechaFin(initialValues?.fecha_fin ? String(initialValues.fecha_fin).slice(0, 10) : '');
    setEstado(initialValues?.estado ?? 'ACTIVA');
    setRegistros(String(initialValues?.registros ?? ''));
    setCumplimiento(String(initialValues?.cumplimiento ?? ''));
    setObservaciones(initialValues?.observaciones ?? '');
    setErrors([]);
    setSaving(false);
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const isEdit = title.toLowerCase().includes('editar');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    // Validación frontend
    const locales = [];
    if (!codigo.trim())  locales.push('El código es obligatorio (ej: S07-2026).');
    if (!fecha_inicio)   locales.push('La fecha de inicio es obligatoria.');
    if (!fecha_fin)      locales.push('La fecha de fin es obligatoria.');
    if (fecha_inicio && fecha_fin && fecha_fin < fecha_inicio)
                         locales.push('La fecha de fin no puede ser anterior a la fecha de inicio.');
    if (locales.length > 0) return setErrors(locales);

    const payload = {
      codigo: codigo.trim(),
      fecha_inicio,
      fecha_fin,
      estado,
      ...(registros    && { registros: Number(registros) }),
      ...(cumplimiento && { cumplimiento: Number(cumplimiento) }),
      ...(observaciones.trim() && { observaciones: observaciones.trim() }),
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
        const msg = err?.response?.data?.message ?? err?.message ?? 'No se pudo guardar la semana.';
        setErrors([msg]);
      }
      setSaving(false);
    }
  };

  return (
    <div className="nrm-backdrop" onClick={onClose}>
      <div className="nrm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">

        <div className="nrm-header">
          <div>
            <h3 className="nrm-title">{title}</h3>
            <p className="nrm-subtitle">Completa los datos de la semana operativa</p>
          </div>
          <button className="nrm-close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="nrm-form" onSubmit={handleSubmit}>
          <div className="nrm-scroll-area">

            <div className="nrm-field">
              <label className="nrm-label">Código <span className="nrm-req">*</span></label>
              <input className="nrm-input" value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej: S07-2026" autoFocus />
            </div>

            <div className="nrm-row">
              <div className="nrm-field">
                <label className="nrm-label">Fecha Inicio <span className="nrm-req">*</span></label>
                <input className="nrm-input" type="date" value={fecha_inicio}
                  onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div className="nrm-field">
                <label className="nrm-label">Fecha Fin <span className="nrm-req">*</span></label>
                <input className="nrm-input" type="date" value={fecha_fin}
                  onChange={(e) => setFechaFin(e.target.value)} />
              </div>
            </div>

            <div className="nrm-field">
              <label className="nrm-label">Estado</label>
              <select className="nrm-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="ACTIVA">Activa</option>
                <option value="CERRADA">Cerrada</option>
              </select>
            </div>

            <div className="nrm-row">
              <div className="nrm-field">
                <label className="nrm-label">Registros <span className="nrm-opt">(opcional)</span></label>
                <input className="nrm-input" type="number" min="0" value={registros}
                  onChange={(e) => setRegistros(e.target.value)} placeholder="Ej: 12" />
              </div>
              <div className="nrm-field">
                <label className="nrm-label">Cumplimiento % <span className="nrm-opt">(opcional)</span></label>
                <input className="nrm-input" type="number" min="0" max="100" value={cumplimiento}
                  onChange={(e) => setCumplimiento(e.target.value)} placeholder="Ej: 85" />
              </div>
            </div>

            <div className="nrm-field">
              <label className="nrm-label">Observaciones <span className="nrm-opt">(opcional)</span></label>
              <textarea className="nrm-textarea" value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Semana en curso" rows={2} />
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
            <button className="btn-modal-submit" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear semana'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}