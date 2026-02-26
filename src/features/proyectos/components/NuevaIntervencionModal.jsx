import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getProcesos } from '../services/procesosService';

export default function NuevaIntervencionModal({ isOpen, title = 'Nueva Intervención', initialValues, onClose, onSubmit }) {
  const [codigo,      setCodigo]      = useState('');
  const [nombre,      setNombre]      = useState('');
  const [proceso,     setProceso]     = useState('');   // ObjectId del proceso
  const [activo,      setActivo]      = useState(true);
  const [descripcion, setDescripcion] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [procesos,    setProcesos]    = useState([]);   // lista para el select

  // Cargar lista de procesos activos
  useEffect(() => {
    if (!isOpen) return;
    getProcesos()
      .then((res) => {
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.data?.data)) list = res.data.data;
        // Solo procesos activos
        setProcesos(list.filter((p) => p.activo !== false));
      })
      .catch(() => setProcesos([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setCodigo(initialValues?.codigo ?? '');
    setNombre(initialValues?.nombre ?? '');

    // initialValues.proceso puede ser un ObjectId string o un objeto poblado
    const proc = initialValues?.proceso;
    if (typeof proc === 'string')      setProceso(proc);
    else if (proc?._id)                setProceso(proc._id);
    else if (proc?.id)                 setProceso(proc.id);
    else                               setProceso('');

    // El backend usa 'activo', el modal puede recibir activo o estado
    const rawActivo = initialValues?.activo ?? initialValues?.estado;
    if (typeof rawActivo === 'boolean')     setActivo(rawActivo);
    else if (typeof rawActivo === 'number') setActivo(rawActivo === 1);
    else if (typeof rawActivo === 'string') {
      const v = rawActivo.toLowerCase().trim();
      setActivo(v === 'activo' || v === 'activa' || v === 'active' || v === 'true' || v === '1');
    } else setActivo(true);

    setDescripcion(initialValues?.descripcion ?? '');
    setError(null);
    setSaving(false);
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const isEdit = title.toLowerCase().includes('editar');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      codigo:      String(codigo).trim(),
      nombre:      String(nombre).trim(),
      proceso:     proceso,          // ObjectId
      activo:      Boolean(activo),
      descripcion: String(descripcion).trim(),
    };

    if (!payload.codigo || !payload.nombre || !payload.proceso) {
      setError('Código, nombre y proceso son obligatorios');
      return;
    }

    try {
      setSaving(true);
      await onSubmit?.(payload);
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            <p className="modal-subtitle">Completa los datos de la intervención</p>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose}><X size={18} /></button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <label className="field">
            <span>Código *</span>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: INT-001" autoFocus />
          </label>

          <label className="field">
            <span>Nombre *</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Establecimiento" />
          </label>

          <label className="field">
            <span>Proceso *</span>
            <select value={proceso} onChange={(e) => setProceso(e.target.value)}>
              <option value="">— Selecciona un proceso —</option>
              {procesos.map((p) => (
                <option key={p._id ?? p.id} value={p._id ?? p.id}>
                  {p.codigo} – {p.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Estado</span>
            <select value={activo ? 'true' : 'false'} onChange={(e) => setActivo(e.target.value === 'true')}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>

          <label className="field">
            <span>Descripción</span>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción opcional"
              rows="3"
              style={{ padding:'12px 14px', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'14px', color:'#111827', background:'#fff', outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit', resize:'vertical' }}
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button className="btn-modal-cancel" type="button" onClick={onClose}>Cancelar</button>
            <button className="btn-modal-submit" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}