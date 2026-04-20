import { useState } from 'react';
import { Eye, Pencil, Trash2, Plus, Search, Users } from 'lucide-react';
import UsuarioModal from './UsuarioModal';

export default function UsuariosTable({ usuarios = [], search = '', setSearch, onAdd, onUpdate, onDelete }) {
  const [openCreate, setOpenCreate] = useState(false);
  const [editUsuario, setEditUsuario] = useState(null);

  const getId = (u) => u?._id ?? u?.id;

  return (
    <div style={{ width: '100%', display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', flex: 1, minWidth: 0 }}>
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch?.(e.target.value)}
              placeholder="Buscar usuario..."
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', background: 'transparent' }}
            />
          </div>
        </div>

        <button
          onClick={() => setOpenCreate(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 14, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
        >
          <Plus size={16} />
          Nuevo usuario
        </button>
      </div>

      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '14px 18px', fontSize: 13, color: '#475569' }}>Nombre</th>
              <th style={{ padding: '14px 18px', fontSize: 13, color: '#475569' }}>Correo</th>
              <th style={{ padding: '14px 18px', fontSize: 13, color: '#475569' }}>Rol</th>
              <th style={{ padding: '14px 18px', fontSize: 13, color: '#475569' }}>Estado</th>
              <th style={{ padding: '14px 18px', fontSize: 13, color: '#475569', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '22px 18px', textAlign: 'center', color: '#64748b' }}>
                  No hay usuarios para mostrar
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => {
                const id = getId(usuario);
                const isActive = String(usuario.estado ?? 'Activo').toLowerCase() === 'activo';
                return (
                  <tr key={id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: '#eef2ff', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#4338ca' }}>
                          <Users size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{usuario.nombre ?? '-'}</div>
                          <div style={{ fontSize: 13, color: '#64748b' }}>{usuario.email ?? '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#475569' }}>{usuario.email ?? '-'}</td>
                    <td style={{ padding: '14px 18px', color: '#475569' }}>{String(usuario.rol ?? 'usuario').toUpperCase()}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, fontSize: 12, color: isActive ? '#166534' : '#991b1b', background: isActive ? 'rgba(22,101,52,0.12)' : 'rgba(220,38,38,0.12)' }}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button title="Editar" onClick={() => setEditUsuario(usuario)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
                          <Pencil size={16} />
                        </button>
                        <button title="Eliminar" onClick={() => onDelete?.(id)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <UsuarioModal
        isOpen={openCreate}
        title="Nuevo usuario"
        initialValues={{ nombre: '', email: '', rol: 'usuario', estado: 'Activo', permisos: [] }}
        onClose={() => setOpenCreate(false)}
        onSubmit={async (values) => {
          await onAdd?.(values);
          setOpenCreate(false);
        }}
      />

      <UsuarioModal
        isOpen={!!editUsuario}
        title="Editar usuario"
        initialValues={editUsuario ?? {}}
        onClose={() => setEditUsuario(null)}
        onSubmit={async (values) => {
          await onUpdate?.(getId(editUsuario), values);
          setEditUsuario(null);
        }}
      />
    </div>
  );
}
