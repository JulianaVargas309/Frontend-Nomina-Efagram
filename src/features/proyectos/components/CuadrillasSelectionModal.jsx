import { useEffect, useState } from 'react';
import httpClient from '../../../core/api/httpClient';
import { CheckCircle2, X } from 'lucide-react';

const CuadrillasSelectionModal = ({
  open,
  cuadrillas = [],
  selectedIds = [],
  onConfirm,
  onClose,
  title = 'Seleccionar cuadrillas',
}) => {
  const [selection, setSelection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableCuadrillas, setAvailableCuadrillas] = useState(cuadrillas);

  useEffect(() => {
    if (!open) return;
    setSelection(Array.isArray(selectedIds) ? [...selectedIds] : []);
    setError('');

    if (Array.isArray(cuadrillas) && cuadrillas.length > 0) {
      setAvailableCuadrillas(cuadrillas);
      return;
    }

    const loadCuadrillas = async () => {
      setLoading(true);
      try {
        const res = await httpClient.get('/cuadrillas', { params: { activa: true } });
        setAvailableCuadrillas(res?.data?.data ?? []);
      } catch (e) {
        console.error('Error cargando cuadrillas:', e);
        setError('No se pudieron cargar las cuadrillas. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadCuadrillas();
  }, [open, selectedIds, cuadrillas]);

  const toggleCuadrilla = (id) => {
    setSelection((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm?.(selection);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: 'min(640px, 100%)', background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 64px rgba(15,23,42,0.25)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6e8ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{title}</h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
              Selecciona las cuadrillas que quieres asignar al subproyecto.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
        </div>

        <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', color: '#991b1b' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ color: '#64748b' }}>Cargando cuadrillas...</div>
          ) : availableCuadrillas.length === 0 ? (
            <div style={{ color: '#64748b' }}>No hay cuadrillas disponibles para seleccionar.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {availableCuadrillas.map((cuadrilla) => {
                const id = cuadrilla._id ?? cuadrilla;
                const selected = selection.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleCuadrilla(id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 14,
                      border: `1.5px solid ${selected ? '#1f8f57' : '#e6e8ef'}`,
                      background: selected ? '#f0faf4' : '#fff',
                      cursor: 'pointer',
                      color: '#0f172a',
                      textAlign: 'left',
                    }}
                  >
                    <span>{typeof cuadrilla === 'string' ? id : cuadrilla.nombre ?? cuadrilla.name ?? id}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, background: selected ? '#1f8f57' : '#e6e8ef', color: selected ? '#fff' : '#64748b' }}>
                      {selected ? <CheckCircle2 size={14} /> : '○'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 22px', borderTop: '1px solid #e6e8ef', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '11px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{ background: '#1f8f57', color: '#fff', border: 'none', padding: '11px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CuadrillasSelectionModal;
