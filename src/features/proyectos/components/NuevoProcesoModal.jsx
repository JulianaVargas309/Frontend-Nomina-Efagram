import { useEffect, useReducer } from 'react';
import { X, AlertCircle } from 'lucide-react';

const INITIAL_STATE = {
  codigo:      '',
  nombre:      '',
  descripcion: '',
  estado:      true,
  saving:      false,
  errors:      [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, errors: [] };
    case 'RESET':
      return { ...INITIAL_STATE, ...action.values };
    case 'SET_SAVING':
      return { ...state, saving: action.value };
    case 'SET_ERRORS':
      return { ...state, errors: action.value };
    default:
      return state;
  }
}

export default function NuevoProcesoModal({
  isOpen,
  title = 'Nuevo Proceso',
  initialValues,
  onClose,
  onSubmit,
}) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const setField = (field) => (e) =>
    dispatch({ type: 'SET_FIELD', field, value: e.target.value });

  useEffect(() => {
    if (!isOpen) return;
    const estadoValue = initialValues?.estado;
    dispatch({
      type: 'RESET',
      values: {
        codigo:      initialValues?.codigo      ?? '',
        nombre:      initialValues?.nombre      ?? '',
        descripcion: initialValues?.descripcion ?? '',
        estado:      typeof estadoValue === 'boolean' ? estadoValue : true,
        saving:      false,
        errors:      [],
      },
    });
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const isEdit = title.toLowerCase().includes('editar');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_ERRORS', value: [] });

    const locales = [];
    if (!state.codigo.trim()) locales.push('El código es obligatorio.');
    if (!state.nombre.trim()) locales.push('El nombre del proceso es obligatorio.');
    if (locales.length > 0) { dispatch({ type: 'SET_ERRORS', value: locales }); return; }

    const payload = {
      codigo:      state.codigo.trim(),
      nombre:      state.nombre.trim(),
      descripcion: state.descripcion.trim() || undefined,
      estado:      Boolean(state.estado),
    };

    try {
      dispatch({ type: 'SET_SAVING', value: true });
      await onSubmit?.(payload);
    } catch (err) {
      const backendErrors = err?.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        const MENSAJES = {
          codigo:      'El código es obligatorio.',
          nombre:      'El nombre del proceso es obligatorio.',
          descripcion: 'La descripción no es válida.',
          estado:      'El estado es obligatorio.',
        };
        dispatch({
          type: 'SET_ERRORS',
          value: backendErrors.map(e => {
            const campo = e.path ?? e.param ?? e.field ?? '';
            return MENSAJES[campo] ?? e.msg ?? e.message ?? `Campo inválido: ${campo}`;
          }),
        });
      } else {
        dispatch({ type: 'SET_ERRORS', value: [err?.response?.data?.message || 'No se pudo guardar el proceso.'] });
      }
      dispatch({ type: 'SET_SAVING', value: false });
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            <p className="modal-subtitle">Completa los datos del proceso</p>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <form className="modal-body" onSubmit={handleSubmit}>

          <label className="field">
            <span>Código *</span>
            <input
              value={state.codigo}
              onChange={setField('codigo')}
              placeholder="Ej: COSECHA"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Nombre *</span>
            <input
              value={state.nombre}
              onChange={setField('nombre')}
              placeholder="Ej: Cosecha"
            />
          </label>

          <label className="field">
            <span>
              Descripción{' '}
              <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span>
            </span>
            <textarea
              value={state.descripcion}
              onChange={setField('descripcion')}
              placeholder="Descripción del proceso"
              rows="3"
              style={{
                padding: '12px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#111827',
                background: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </label>

          <label className="field">
            <span>Estado *</span>
            <select
              value={state.estado ? 'true' : 'false'}
              onChange={(e) =>
                dispatch({ type: 'SET_FIELD', field: 'estado', value: e.target.value === 'true' })
              }
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>

          {/* ACCIONES con error banner encima de botones */}
          <div className="modal-actions" style={{ flexDirection: 'column', gap: 10 }}>
            {state.errors.length > 0 && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'flex-start', gap: 8,
                width: '100%', boxSizing: 'border-box',
              }}>
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  {state.errors.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: '#dc2626', marginBottom: i < state.errors.length - 1 ? 4 : 0 }}>
                      <span style={{ flexShrink: 0 }}>•</span>
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
              <button className="btn-modal-cancel" type="button" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn-modal-submit" type="submit" disabled={state.saving}>
                {state.saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}