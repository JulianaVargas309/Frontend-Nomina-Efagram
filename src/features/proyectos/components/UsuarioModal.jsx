import { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const ROLES_DISPONIBLES = [
    { id: 'ADMIN_SISTEMA', nombre: 'Administrador del Sistema', color: '#DC2626' },
    { id: 'SUPERVISOR', nombre: 'Supervisor', color: '#16a34a' },
];

export default function UsuarioModal({
    isOpen,
    title = 'Usuario',
    initialValues = {},
    onClose,
    onSubmit,
    userRole = 'SUPERVISOR',
}) {
    const isEdit = title.toLowerCase().includes('editar');
    const isAdmin = userRole === 'ADMIN_SISTEMA';

    const [nombre, setNombre] = useState(initialValues.nombre ?? '');
    const [email, setEmail] = useState(initialValues.email ?? '');
    const [rol, setRol] = useState(initialValues.roles?.[0] ?? 'SUPERVISOR');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        setNombre(initialValues.nombre ?? '');
        setEmail(initialValues.email ?? '');
        setRol(initialValues.roles?.[0] ?? 'SUPERVISOR');
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
            roles: [rol],
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

    const selectedRoleData = ROLES_DISPONIBLES.find(r => r.id === rol);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
            <form
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                style={{ position: 'relative', zIndex: 1, width: 'min(600px, 100%)', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 22px 64px rgba(15,23,42,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: '#fff' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>Administra los datos del usuario.</p>
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
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, background: '#fff', color: '#0f172a' }}
                        />
                    </label>

                    <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155', fontWeight: 600 }}>
                        Correo electrónico *
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setErrors([]); }}
                            placeholder="usuario@empresa.com"
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, background: '#fff', color: '#0f172a' }}
                        />
                    </label>

                    <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155', fontWeight: 600 }}>
                        Rol *
                        <select
                            value={rol}
                            onChange={(e) => {
                                setRol(e.target.value);
                                setErrors([]);
                            }}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, background: '#fff', cursor: 'pointer', color: '#0f172a', fontWeight: 500 }}
                        >
                            {ROLES_DISPONIBLES.map(role => (
                                <option key={role.id} value={role.id}>
                                    {role.nombre}
                                </option>
                            ))}
                        </select>
                        {selectedRoleData && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '10px 12px', background: '#f0fdf4', borderRadius: 10, border: `1px solid ${selectedRoleData.color}33` }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: selectedRoleData.color }} />
                                <span style={{ fontSize: 13, color: '#15803d' }}>
                                    {selectedRoleData.nombre}
                                </span>
                            </div>
                        )}
                    </label>

                    <label style={{ display: 'grid', gap: 6, fontSize: 14, color: '#334155', fontWeight: 600 }}>
                        Contraseña {!isEdit ? '*' : '(dejar vacío para no cambiar)'}
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setErrors([]); }}
                            placeholder={isEdit ? "Nueva contraseña opcional" : "Ingresa la contraseña"}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, background: '#fff', color: '#0f172a' }}
                        />
                    </label>

                    {!isAdmin && rol === 'ADMIN_SISTEMA' && !isEdit && (
                        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <AlertCircle size={18} style={{ color: '#92400e', flexShrink: 0, marginTop: 2 }} />
                            <span style={{ fontSize: 13, color: '#92400e' }}>
                                ❌ <strong>No tienes permisos</strong> para crear administradores. Solo ADMIN_SISTEMA puede hacerlo.
                            </span>
                        </div>
                    )}

                    {errors.length > 0 && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', display: 'grid', gap: 8 }}>
                            {errors.map((error, index) => (
                                <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#b91c1c' }}>
                                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                                    <span>{error}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '18px 24px 20px', background: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ minWidth: 110, padding: '10px 16px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving || (!isAdmin && rol === 'ADMIN_SISTEMA' && !isEdit)}
                        style={{ minWidth: 110, padding: '10px 16px', borderRadius: 10, border: 'none', background: (!isAdmin && rol === 'ADMIN_SISTEMA' && !isEdit) ? '#cbd5e1' : '#16a34a', color: '#fff', cursor: (!isAdmin && rol === 'ADMIN_SISTEMA' && !isEdit) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14 }}
                    >
                        {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
                    </button>
                </div>
            </form>
        </div>
    );
}
