import { useEffect, useState } from 'react';
import DashboardLayout from '../../../app/layouts/DashboardLayout';
import UsuariosTable from '../components/UsuariosTable';
import { useAuth } from '../../../app/providers/useAuth';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../services/usuariosService';
import '../../territorial/territorial.css';

export default function CatalogoUsuariosPage() {
    const { user } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Obtener el primer rol del usuario
    const userRole = Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles[0] : 'SUPERVISOR';
    const isAdmin = userRole === 'ADMIN_SISTEMA';

    const fetchUsuarios = async (pageNum = 1, searchQuery = '') => {
        try {
            setLoading(true);
            const res = await getUsuarios(pageNum, limit, searchQuery);
            setUsuarios(res.usuarios || []);
            setTotalPages(res.paginacion?.pages || 1);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('No se pudo cargar el catálogo de usuarios.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios(1, search);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (value) => {
        setSearch(value);
        setPage(1);
        fetchUsuarios(1, value);
    };

    const getId = (usuario) => usuario?._id ?? usuario?.id;

    const handleAdd = async (payload) => {
        try {
            const created = await createUsuario(payload);
            const usuario = created?.usuario || created?.data || created;

            if (usuario && (usuario._id || usuario.id)) {
                setUsuarios((prev) => [usuario, ...prev]);
                if (usuarios.length >= limit) {
                    setUsuarios((prev) => prev.slice(0, -1));
                }
            }
        } catch (err) {
            console.error('Error al crear usuario:', err);
            setError(err?.message || 'No se pudo crear el usuario.');
        }
    };

    const handleUpdate = async (id, payload) => {
        try {
            const updated = await updateUsuario(id, payload);
            const usuario = updated?.usuario || updated?.data || updated;

            if (usuario && (usuario._id || usuario.id)) {
                setUsuarios((prev) => prev.map((u) => (getId(u) === id ? usuario : u)));
            }
        } catch (err) {
            console.error('Error al actualizar usuario:', err);
            setError(err?.message || 'No se pudo actualizar el usuario.');
        }
    };

    const handleDelete = async (id) => {
        if (!isAdmin) {
            setError('Solo administradores pueden eliminar usuarios.');
            return;
        }

        try {
            await deleteUsuario(id);
            setUsuarios((prev) => prev.filter((usuario) => getId(usuario) !== id));
        } catch (err) {
            console.error('Error al eliminar usuario:', err);
            setError(err?.message || 'No se pudo eliminar el usuario.');
        }
    };

    return (
        <DashboardLayout>
            <div className="territorial-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' }}>Catálogo de usuarios</h1>
                        <p style={{ margin: '8px 0 0', color: '#475569' }}>Administra los usuarios del sistema y sus roles.</p>
                    </div>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', marginBottom: 16, color: '#b91c1c', fontSize: 14 }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="territorial-loading">Cargando…</div>
                ) : (
                    <>
                        <UsuariosTable
                            usuarios={usuarios}
                            search={search}
                            setSearch={handleSearch}
                            onAdd={handleAdd}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            userRole={userRole}
                        />

                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => {
                                            setPage(p);
                                            fetchUsuarios(p, search);
                                        }}
                                        style={{ padding: '8px 12px', borderRadius: 8, border: page === p ? 'none' : '1px solid #e5e7eb', background: page === p ? '#2563eb' : '#fff', color: page === p ? '#fff' : '#334155', cursor: 'pointer', fontWeight: page === p ? 600 : 400 }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
