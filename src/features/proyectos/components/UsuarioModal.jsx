import { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

function resolvePermisos(value) {
  if (!value) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string') return value;
  return '';
}

export default function UsuarioModal({
  isOpen,
  title = 'Usuario',
  initialValues = {},
  onClose,
  onSubmit,
}) {
  const isEdit = title.toLowerCase().includes('editar');
  const [nombre, setNombre] = useState(initialValues.nombre ?? '');
  const [email, setEmail] = useState(initialValues.email ?? '');
  const [rol, setRol] = useState(initialValues.rol ?? 'usuario');
  const [estado, setEstado] = useState(initialValues.estado ?? 'Activo');
  const [permisos, setPermisos] = useState(resolvePermisos(initialValues.permisos));
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setNombre(initialValues.nombre ?? '');
    setEmail(initialValues.email ?? '');
    setRol(initialValues.rol ?? 'usuario');
    setEstado(initialValues.estado ?? 'Activo');
    setPermisos(resolvePermisos(initialValues.permisos));
    setPassword('');
    setErrors([]);
    setSaving(false);
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = [];

    if (!nombre.trim()) validation.push('El nombre es obligatorio.');
    if (!email.trim()) validation.push('El correo es obligatorio.');
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email.trim())) {
      validation.push('El correo no tiene un formato válido.');
    }

    if (!isEdit && !password.trim()) {
      validation.push('La contraseña es obligatoria para un usuario nuevo.');
    }

    if (validation.length > 0) {
      setErrors(validation);
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      rol,
      estado,
      permisos: permisos
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    try {
      setSaving(true);
      await onSubmit?.(payload);
    } catch (error) {
      setErrors([error?.message || 'No se pudo guardar el usuario.']);
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ position: 'relative', zIndex: 1, width: 'min(600px, 100%)', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 22px 64px rgba(15,23,42,0.18)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>Administra los datos del usuario y sus permisos.</p>
          </div>
          <button type="button" onClick={onClose} style={{ width: 34, height: 34, borderRadius: 12, border: '1px solid #e5e7eb', background: '#f8fafc', color: '#475569', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'grid', gap: 16 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155' }}>
            Nombre completo *
            <input
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrors([]); }}
              placeholder="Nombre del usuario"
              autoFocus
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155' }}>
            Correo electrónico *
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors([]); }}
              placeholder="usuario@empresa.com"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </label>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155' }}>
              Rol
              <select value={rol} onChange={(e) => setRol(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }}>
                <option value="admin">Administrador</option>
                <option value="usuario">Usuario</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155' }}>
              Estado
              <select value={estado} onChange={(e) => setEstado(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }}>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155' }}>
            Permisos
            <input
              value={permisos}
              onChange={(e) => { setPermisos(e.target.value); setErrors([]); }}
              placeholder="Ej: leer, crear, editar"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }}
            />
            <small style={{ color: '#64748b' }}>Ingrese permisos separados por coma.</small>
          </label>

          {!isEdit && (
            <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155' }}>
              Contraseña *
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors([]); }}
                placeholder="Contraseña del usuario"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </label>
          )}

          {isEdit && (
            <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155' }}>
              Contraseña (dejar vacío para no cambiar)
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors([]); }}
                placeholder="Nueva contraseña opcional"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </label>
          )}

          {errors.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', display: 'grid', gap: 6 }}>
              {errors.map((error, index) => (
                <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#b91c1c' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '18px 24px 20px', background: '#f8fafc' }}>
          <button type="button" onClick={onClose} style={{ minWidth: 110, padding: '10px 16px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} style={{ minWidth: 110, padding: '10px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}
