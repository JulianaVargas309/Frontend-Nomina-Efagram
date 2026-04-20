import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../app/layouts/DashboardLayout';
import UsuariosTable from '../components/UsuariosTable';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../services/usuariosService';
import '../../territorial/territorial.css';

export default function CatalogoUsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeList = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await getUsuarios();
      setUsuarios(normalizeList(res));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el catálogo de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsuarios = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return usuarios;

    return usuarios.filter((usuario) => {
      const nombre = String(usuario?.nombre ?? '').toLowerCase();
      const email = String(usuario?.email ?? '').toLowerCase();
      const rol = String(usuario?.rol ?? '').toLowerCase();
      return nombre.includes(q) || email.includes(q) || rol.includes(q);
    });
  }, [usuarios, search]);

  const getId = (usuario) => usuario?._id ?? usuario?.id;

  const handleAdd = async (payload) => {
    const created = await createUsuario(payload);
    const obj = created?.data ?? created;

    if (obj && (obj._id || obj.id)) {
      setUsuarios((prev) => [obj, ...prev]);
    } else {
      await fetchUsuarios();
    }
  };

  const handleUpdate = async (id, payload) => {
    const updated = await updateUsuario(id, payload);
    const obj = updated?.data ?? updated;

    if (obj && (obj._id || obj.id)) {
      setUsuarios((prev) => prev.map((usuario) => (getId(usuario) === id ? obj : usuario)));
    } else {
      await fetchUsuarios();
    }
  };

  const handleDelete = async (id) => {
    await deleteUsuario(id);
    setUsuarios((prev) => prev.filter((usuario) => getId(usuario) !== id));
  };

  return (
    <DashboardLayout>
      <div className="territorial-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' }}>Catálogo de usuarios</h1>
            <p style={{ margin: '8px 0 0', color: '#475569' }}>Administra los usuarios del sistema, sus roles, estado y permisos.</p>
          </div>
        </div>

        {loading ? (
          <div className="territorial-loading">Cargando…</div>
        ) : error ? (
          <div className="territorial-error">{error}</div>
        ) : (
          <UsuariosTable
            usuarios={filteredUsuarios}
            search={search}
            setSearch={setSearch}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
