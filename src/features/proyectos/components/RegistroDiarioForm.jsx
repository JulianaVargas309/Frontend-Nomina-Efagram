import { useEffect, useState } from 'react';
import { progresoService } from '../services/progresoService';

const RegistroDiarioForm = ({ programaciones, onRegistroGuardado }) => {
  const [formData, setFormData] = useState({
    programacion_id: '',
    fecha: new Date().toISOString().slice(0, 10),
    cantidad_ejecutada: 0,
    observaciones: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  useEffect(() => {
    if (!formData.programacion_id && programaciones.length > 0) {
      setFormData((prev) => ({ ...prev, programacion_id: programaciones[0]._id }));
    }
  }, [programaciones, formData.programacion_id]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.programacion_id) {
      setMensaje('Selecciona una programación antes de guardar.');
      setTipoMensaje('error');
      return;
    }

    setEnviando(true);
    setMensaje('');
    setTipoMensaje('');

    try {
      await progresoService.crearRegistroDiario({
        programacion_id: formData.programacion_id,
        fecha: formData.fecha,
        cantidad_ejecutada: Number(formData.cantidad_ejecutada) || 0,
        observaciones: formData.observaciones,
      });

      setMensaje('Registro guardado. Actualizando progreso...');
      setTipoMensaje('success');
      setFormData((prev) => ({
        ...prev,
        cantidad_ejecutada: 0,
        observaciones: '',
      }));

      if (onRegistroGuardado) {
        onRegistroGuardado();
      }
    } catch (error) {
      setMensaje(
        `No fue posible guardar el registro: ${error?.message || error?.error || 'Error desconocido'}`
      );
      setTipoMensaje('error');
      console.error('RegistroDiarioForm error:', error);
    } finally {
      setEnviando(false);
    }
  };

  const programacionesOptions = programaciones || [];

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 22 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
        Registrar actividad diaria
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: 16, marginBottom: 18 }}>
          <label style={{ display: 'grid', gap: 8, fontSize: 14, color: '#334155' }}>
            Programación
            <select
              value={formData.programacion_id}
              onChange={(e) => handleChange('programacion_id', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                background: '#fff',
                fontSize: 14,
              }}
            >
              <option value="">Selecciona una programación...</option>
              {programacionesOptions.map((prog) => (
                <option key={prog._id} value={prog._id}>
                  {prog.actividad?.nombre ?? prog.nombre ?? 'Programación'} - {prog.contrato?.codigo ?? prog.contrato?.nombre ?? 'Sin contrato'}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 8, fontSize: 14, color: '#334155' }}>
            Fecha
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => handleChange('fecha', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                background: '#fff',
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 8, fontSize: 14, color: '#334155' }}>
            Cantidad ejecutada
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.cantidad_ejecutada}
              onChange={(e) => handleChange('cantidad_ejecutada', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                background: '#fff',
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 8, fontSize: 14, color: '#334155' }}>
            Observaciones
            <textarea
              rows="3"
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                background: '#fff',
                fontSize: 14,
                resize: 'vertical',
                minHeight: 94,
              }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={enviando}
            style={{
              background: '#1f8f57',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 18px',
              fontWeight: 700,
              cursor: enviando ? 'not-allowed' : 'pointer',
            }}
          >
            {enviando ? 'Guardando...' : 'Guardar registro'}
          </button>

          <button
            type="button"
            onClick={() => setFormData((prev) => ({
              ...prev,
              cantidad_ejecutada: 0,
              observaciones: '',
            }))}
            className="btn-secondary"
            style={{
              background: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              padding: '12px 18px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Limpiar
          </button>
        </div>

        {mensaje && (
          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 12,
              background: tipoMensaje === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${tipoMensaje === 'success' ? '#86efac' : '#fecaca'}`,
              color: tipoMensaje === 'success' ? '#166534' : '#991b1b',
            }}
          >
            {mensaje}
          </div>
        )}
      </form>
    </div>
  );
};

export default RegistroDiarioForm;
