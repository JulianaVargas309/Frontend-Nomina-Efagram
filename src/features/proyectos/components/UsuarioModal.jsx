import { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

function resolvePermisos(value, rol) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        return value.split(',').map(p => p.trim()).filter(Boolean);
    }
    // Auto-asignar permisos según el rol
    if (rol === 'ADMIN_SISTEMA') return ['ADMIN', 'VER_USUARIOS', 'CREAR_USUARIOS', 'EDITAR_USUARIOS', 'ELIMINAR_USUARIOS', 'VER_REPORTES', 'CONFIGURAR_SISTEMA'];
    return ['USUARIO', 'VER_USUARIOS', 'VER_REPORTES', 'CREAR_REGISTROS'];
}

const PERMISOS_PREDEFINIDOS = {
    ADMIN_SISTEMA: ['ADMIN', 'VER_USUARIOS', 'CREAR_USUARIOS', 'EDITAR_USUARIOS', 'ELIMINAR_USUARIOS', 'VER_REPORTES', 'CONFIGURAR_SISTEMA'],
    TRABAJADOR: ['USUARIO', 'VER_USUARIOS', 'VER_REPORTES', 'CREAR_REGISTROS']
};

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
    const defaultRol = isEdit ? (initialValues.rol ?? 'TRABAJADOR') : 'ADMIN_SISTEMA';
    const [rol, setRol] = useState(defaultRol);
    const [estado, setEstado] = useState(initialValues.estado ?? 'Activo');
    const [permisos, setPermisos] = useState(resolvePermisos(initialValues.permisos, defaultRol));
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    const [showPermisosCustom, setShowPermisosCustom] = useState(false);
    const [permisosCustom, setPermisosCustom] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const defaultRolForReset = isEdit ? (initialValues.rol ?? 'TRABAJADOR') : 'ADMIN_SISTEMA';
        setNombre(initialValues.nombre ?? '');
        setEmail(initialValues.email ?? '');
        setRol(defaultRolForReset);
        setEstado(initialValues.estado ?? 'Activo');
        setPermisos(resolvePermisos(initialValues.permisos, defaultRolForReset));
        setPassword('');
        setErrors([]);
        setSaving(false);
        setShowPermisosCustom(false);
        setPermisosCustom('');
    }, [isOpen, initialValues, isEdit]);

    // Auto-actualizar permisos cuando cambia el rol
    useEffect(() => {
        if (!showPermisosCustom) {
            setPermisos(resolvePermisos(undefined, rol));
        }
    }, [rol, showPermisosCustom]);

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
            permisos: showPermisosCustom && permisosCustom.trim()
                ? permisosCustom.split(',').map(p => p.trim()).filter(Boolean)
                : permisos,
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
                style={{ position: 'relative', zIndex: 1, width: 'min(650px, 100%)', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 22px 64px rgba(15,23,42,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: '#fff' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>Administra los datos del usuario y sus permisos.</p>
                    </div>
                    <button type="button" onClick={onClose} style={{ width: 34, height: 34, borderRadius: 12, border: '1px solid #e5e7eb', background: '#f8fafc', color: '#475569', cursor: 'pointer' }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: '20px 24px', display: 'grid', gap: 16 }}>
                    <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155', fontWeight: 600 }}>
                        Nombre completo *
                        <input
                            value={nombre}
                            onChange={(e) => { setNombre(e.target.value); setErrors([]); }}
                            placeholder="Ej: Juan Pérez"
                            autoFocus
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14 }}
                        />
                    </label>

                    <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155', fontWeight: 600 }}>
                        Correo electrónico *
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setErrors([]); }}
                            placeholder="usuario@empresa.com"
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14 }}
                        />
                    </label>

                    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                        <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155', fontWeight: 600 }}>
                            Rol *
                            <select 
                                value={rol} 
                                onChange={(e) => {
                                    setRol(e.target.value);
                                    setShowPermisosCustom(false);
                                    setErrors([]);
                                }} 
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, background: '#fff', cursor: 'pointer', color: '#334155', fontWeight: 500 }}
                            >
                                <option value="ADMIN_SISTEMA">Administrador del Sistema</option>
                                <option value="TRABAJADOR">Trabajador</option>
                            </select>
                        </label>
                        <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155', fontWeight: 600 }}>
                            Estado *
                            <select 
                                value={estado} 
                                onChange={(e) => { setEstado(e.target.value); setErrors([]); }} 
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, background: '#fff', cursor: 'pointer', color: '#334155', fontWeight: 500 }}
                            >
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </label>
                    </div>

                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <label style={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>Permisos *</label>
                            <button
                                type="button"
                                onClick={() => setShowPermisosCustom(!showPermisosCustom)}
                                style={{ fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                {showPermisosCustom ? 'Usar predeterminados' : 'Personalizar'}
                            </button>
                        </div>

                        {!showPermisosCustom ? (
                            <div style={{ display: 'grid', gap: 8 }}>
                                {PERMISOS_PREDEFINIDOS[rol]?.map((perm) => (
                                    <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#475569', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f8fafc' }}>
                                        <input
                                            type="checkbox"
                                            checked={permisos.includes(perm)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setPermisos([...permisos, perm]);
                                                } else {
                                                    setPermisos(permisos.filter(p => p !== perm));
                                                }
                                                setErrors([]);
                                            }}
                                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                                        />
                                        <span>{perm}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <textarea
                                value={permisosCustom}
                                onChange={(e) => { setPermisosCustom(e.target.value); setErrors([]); }}
                                placeholder="Ej: ADMIN, CREAR, EDITAR"
                                rows="4"
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
                            />
                        )}
                        <small style={{ color: '#64748b' }}>
                            {showPermisosCustom 
                                ? 'Ingrese permisos separados por coma.' 
                                : 'Selecciona los permisos que tendrá este usuario.'}
                        </small>
                    </div>

                    <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155', fontWeight: 600 }}>
                        Contraseña {!isEdit ? '*' : '(dejar vacío para no cambiar)'}
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setErrors([]); }}
                            placeholder={isEdit ? "Nueva contraseña opcional" : "Ingresa la contraseña"}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14 }}
                        />
                    </label>

                    {rol === 'TRABAJADOR' && !isEdit && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <AlertCircle size={16} style={{ color: '#b91c1c', flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: '#b91c1c' }}>
                                <strong>⚠️ Advertencia:</strong> Este usuario será creado como TRABAJADOR normal. Si deseas que sea administrador, cambia el Rol a "Administrador del Sistema".
                            </span>
                        </div>
                    )}

                    {errors.length > 0 && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', display: 'grid', gap: 6 }}>
                            {errors.map((error, index) => (
                                <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#b91c1c' }}>
                                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                    <span>{error}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 14px' }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>Permisos que se guardarán:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {(showPermisosCustom && permisosCustom.trim()
                                ? permisosCustom.split(',').map(p => p.trim()).filter(Boolean)
                                : permisos
                            ).map((perm) => (
                                <span key={perm} style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                                    {perm}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '18px 24px 20px', background: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
                    <button type="button" onClick={onClose} style={{ minWidth: 110, padding: '10px 16px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer', fontWeight: 600 }}>
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving} style={{ minWidth: 110, padding: '10px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                        {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
                    </button>
                </div>
            </form>
        </div>
    );
}
