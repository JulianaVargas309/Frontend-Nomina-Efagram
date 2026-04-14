import { useEffect, useReducer } from 'react';
import { X } from 'lucide-react';

const INITIAL_STATE = {
  codigo: '',
  nombre: '',
  activo: true,
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

export default function NuevoCargoModal({
  isOpen,
  onClose,
  onSubmit,
  cargo = null,
  title = 'Nuevo Cargo',
  nextCode = '',
}) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const setField = (field) => (e) =>
    dispatch({ type: 'SET_FIELD', field, value: e.target.value });

  useEffect(() => {
    if (!isOpen) return;

    dispatch({
      type: 'RESET',
      values: cargo
        ? {
            codigo: cargo.codigo ?? '',
            nombre: cargo.nombre ?? '',
            activo: Boolean(cargo.activo ?? true),
          }
        : {
            codigo: nextCode || '',
            nombre: '',
            activo: true,
          },
    });
  }, [isOpen, cargo, nextCode]);

  if (!isOpen) return null;

  const isEdit = title.toLowerCase().includes('editar');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_ERROR', value: null });

    if (!String(state.codigo).trim() || !state.nombre.trim()) {
      dispatch({ type: 'SET_ERROR', value: 'Código y nombre son obligatorios' });
      return;
    }

    const payload = {
      codigo: Number(state.codigo),
      nombre: state.nombre.trim(),
      activo: Boolean(state.activo),
    };

    try {
      dispatch({ type: 'SET_SAVING', value: true });
      await onSubmit?.(payload);
    } catch (err) {
      console.error(err);
      dispatch({
        type: 'SET_ERROR',
        value: err?.response?.data?.message || 'No se pudo guardar',
      });
      dispatch({ type: 'SET_SAVING', value: false });
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            <p className="modal-subtitle">Completa los datos del cargo</p>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <label className="field">
            <span>
              Código * {!cargo && <span style={{ color: '#9ca3af', fontWeight: 400 }}>(automático)</span>}
            </span>
            <input
              value={state.codigo}
              onChange={setField('codigo')}
              placeholder="Ej: 001"
              readOnly
              disabled={!cargo}
              title={!cargo ? 'El código se genera automáticamente' : 'El código no puede modificarse'}
              style={
                !cargo
                  ? {
                      background: '#f1f5f9',
                      color: '#64748b',
                      cursor: 'not-allowed',
                    }
                  : undefined
              }
            />
          </label>

          <label className="field">
            <span>Nombre *</span>
            <input
              value={state.nombre}
              onChange={setField('nombre')}
              placeholder="Ej: Operario"
            />
          </label>

          <label className="field">
            <span>Estado</span>
            <select
              value={state.activo ? 'true' : 'false'}
              onChange={(e) =>
                dispatch({
                  type: 'SET_FIELD',
                  field: 'activo',
                  value: e.target.value === 'true',
                })
              }
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
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