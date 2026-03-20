import { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Este componente NO usa useEffect para poblar el formulario.
// El padre debe pasarle una `key` dinámica (ej: key={editFinca?._id ?? 'create'})
// para que React lo desmonte/monte al cambiar, reiniciando el estado solo.
//
// AUTODETECCIÓN DE NÚCLEO:
// Al escribir el código de la finca, se extraen los dígitos iniciales y se
// busca automáticamente el núcleo cuyo campo `codigo` coincida.
// Si no se encuentra ningún núcleo con ese prefijo numérico, el formulario
// queda bloqueado y no permite guardar.
// ─────────────────────────────────────────────────────────────────────────────

function resolveEstado(initialValues) {
  const raw = initialValues?.activa ?? initialValues?.estado;
  if (typeof raw === 'boolean') return raw;
  return true;
}

/**
 * Extrae el prefijo numérico inicial de un string.
 * Ej: "21ALEJA" → "21", "99ADMON" → "99", "ABC" → ""
 */
function extractNumericPrefix(str) {
  const match = String(str).match(/^(\d+)/);
  return match ? match[1] : '';
}

export default function NuevaFincaModal({
  isOpen,
  title = 'Nueva Finca',
  initialValues,
  nucleos = [],
  onClose,
  onSubmit,
}) {
  const [codigo, setCodigo] = useState(initialValues?.codigo  ?? '');
  const [nombre, setNombre] = useState(initialValues?.nombre  ?? '');
  const [nucleo, setNucleo] = useState(
    initialValues?.nucleo ?? initialValues?.nucleoId ?? ''
  );
  const [area,   setArea]   = useState(
    initialValues?.area ?? initialValues?.areaTotal ?? initialValues?.hectareas ?? ''
  );
  const [estado, setEstado] = useState(resolveEstado(initialValues));
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  // Estado del autodetector de núcleo
  const [nucleoDetectado, setNucleoDetectado] = useState(null);   // objeto núcleo encontrado
  const [nucleoError,    setNucleoError]      = useState(null);   // mensaje si no se encontró
  const [buscandoNucleo, setBuscandoNucleo]   = useState(false);  // feedback visual

  const debounceRef = useRef(null);
  const isEdit = title.toLowerCase().includes('editar');

  // ── Precargar núcleo detectado cuando se abre en modo edición ──────────────
  useEffect(() => {
    if (isEdit && codigo) {
      const prefix = extractNumericPrefix(codigo);
      if (prefix) {
        const encontrado = nucleos.find(
          (n) => String(n?.codigo ?? '').trim() === prefix
        );
        if (encontrado) setNucleoDetectado(encontrado);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

  // ── Lógica de autodetección ────────────────────────────────────────────────
  const handleCodigoChange = (e) => {
    const val = e.target.value;
    setCodigo(val);

    clearTimeout(debounceRef.current);

    const prefix = extractNumericPrefix(val);

    if (!prefix) {
      // Sin dígitos iniciales: limpiar detección y núcleo
      setNucleoDetectado(null);
      setNucleoError(null);
      setNucleo('');
      return;
    }

    setBuscandoNucleo(true);
    setNucleoDetectado(null);
    setNucleoError(null);

    // Pequeño debounce para no buscar en cada pulsación de tecla
    debounceRef.current = setTimeout(() => {
      const encontrado = nucleos.find(
        (n) => String(n?.codigo ?? '').trim() === prefix
      );

      if (encontrado) {
        const id = encontrado._id ?? encontrado.id;
        setNucleoDetectado(encontrado);
        setNucleoError(null);
        setNucleo(id);           // seleccionar automáticamente
      } else {
        setNucleoDetectado(null);
        setNucleoError(
          `No existe un núcleo con código "${prefix}". Verifica los primeros dígitos del código de la finca.`
        );
        setNucleo('');
      }

      setBuscandoNucleo(false);
    }, 300);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      codigo: String(codigo).trim(),
      nombre: String(nombre).trim(),
      activa: Boolean(estado),
    };
    if (nucleo)      payload.nucleo     = nucleo;
    if (area !== '') payload.area_total = parseFloat(area);

    if (!payload.codigo || !payload.nombre) {
      setError('Código y nombre son obligatorios');
      return;
    }

    // Bloquear si el prefijo numérico no tiene núcleo asignado
    const prefix = extractNumericPrefix(payload.codigo);
    if (prefix && !nucleoDetectado && !isEdit) {
      setError('El código ingresado no corresponde a ningún núcleo registrado.');
      return;
    }

    try {
      setSaving(true);
      await onSubmit?.(payload);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'No se pudo guardar');
      setSaving(false);
    }
  };

  // ── Render del indicador de núcleo detectado ───────────────────────────────
  const renderNucleoFeedback = () => {
    const prefix = extractNumericPrefix(codigo);
    if (!prefix) return null;

    if (buscandoNucleo) {
      return (
        <div style={styles.feedbackRow}>
          <Loader size={14} style={{ color: '#6b7280', animation: 'spin 1s linear infinite' }} />
          <span style={styles.feedbackNeutral}>Buscando núcleo…</span>
        </div>
      );
    }

    if (nucleoDetectado) {
      return (
        <div style={styles.feedbackRow}>
          <CheckCircle size={14} style={{ color: '#16a34a' }} />
          <span style={styles.feedbackSuccess}>
            Núcleo asignado automáticamente:{' '}
            <strong>{nucleoDetectado.nombre ?? nucleoDetectado.codigo}</strong>
          </span>
        </div>
      );
    }

    if (nucleoError) {
      return (
        <div style={styles.feedbackRow}>
          <AlertCircle size={14} style={{ color: '#dc2626' }} />
          <span style={styles.feedbackError}>{nucleoError}</span>
        </div>
      );
    }

    return null;
  };

  // Determinar si el botón de guardar debe estar deshabilitado
  const prefixActual = extractNumericPrefix(codigo);
  const submitDisabled =
    saving ||
    buscandoNucleo ||
    (!isEdit && Boolean(prefixActual) && !nucleoDetectado);

  return (
    <>
      {/* Animación del spinner inline */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="modal-backdrop">
        <form
          className="modal"
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-header">
            <div>
              <h3 className="modal-title">{title}</h3>
              <p className="modal-subtitle">Completa los datos de la finca</p>
            </div>
            <button className="modal-close-btn" type="button" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="modal-body">

            {/* ── Campo Código con autodetección ── */}
            <label className="field">
              <span>Código</span>
              <input
                value={codigo}
                onChange={handleCodigoChange}
                placeholder="Ej: 21ALEJA"
                autoFocus
                style={
                  prefixActual && nucleoError
                    ? { borderColor: '#dc2626', outline: 'none' }
                    : prefixActual && nucleoDetectado
                    ? { borderColor: '#16a34a', outline: 'none' }
                    : undefined
                }
              />
              {renderNucleoFeedback()}
            </label>

            {/* ── Núcleo: solo lectura, poblado automáticamente ── */}
            <label className="field">
              <span>Núcleo</span>
              {nucleoDetectado ? (
                <div style={styles.nucleoDisplay}>
                  <CheckCircle size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span style={styles.nucleoNombre}>
                    {nucleoDetectado.nombre ?? nucleoDetectado.codigo}
                  </span>
                  <span style={styles.nucleoCodigo}>
                    cód. {nucleoDetectado.codigo}
                  </span>
                </div>
              ) : (
                <select
                  value={nucleo}
                  onChange={(e) => setNucleo(e.target.value)}
                  disabled={Boolean(nucleoDetectado)}
                >
                  <option value="">-- Se asigna automáticamente por código --</option>
                  {nucleos.map((n) => {
                    const id = n?._id ?? n?.id;
                    return (
                      <option key={id} value={id}>
                        {n?.nombre ?? id}
                      </option>
                    );
                  })}
                </select>
              )}
            </label>

            <label className="field">
              <span>Nombre</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: El Paraíso"
              />
            </label>

            <label className="field">
              <span>Área (ha)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ej: 150.5"
              />
            </label>

            <label className="field">
              <span>Estado</span>
              <select
                value={estado ? 'true' : 'false'}
                onChange={(e) => setEstado(e.target.value === 'true')}
              >
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </label>

            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="modal-actions">
            <button className="btn-modal-cancel" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn-modal-submit"
              type="submit"
              disabled={submitDisabled}
              title={
                submitDisabled && !saving
                  ? 'Ingresa un código con un prefijo numérico válido que corresponda a un núcleo existente'
                  : undefined
              }
            >
              {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Estilos inline para los elementos nuevos ──────────────────────────────────
const styles = {
  feedbackRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 5,
    fontSize: 12,
    lineHeight: 1.4,
  },
  feedbackSuccess: {
    color: '#15803d',
  },
  feedbackError: {
    color: '#dc2626',
  },
  feedbackNeutral: {
    color: '#6b7280',
  },
  nucleoDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 6,
    fontSize: 13,
  },
  nucleoNombre: {
    fontWeight: 500,
    color: '#15803d',
    flex: 1,
  },
  nucleoCodigo: {
    color: '#6b7280',
    fontSize: 11,
  },
};