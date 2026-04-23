import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../app/layouts/DashboardLayout';
import CargosStats from '../components/CargosStats';
import CargosTable from '../components/CargosTable';
import {
  getCargos,
  createCargo,
  updateCargo,
  deleteCargo,
} from '../services/cargosService';
import '../../territorial/territorial.css';

export default function CatalogoCargosPage() {
  const [cargos,  setCargos]  = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const normalizeList = (res) => {
    if (Array.isArray(res))             return res;
    if (Array.isArray(res?.data))       return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const sortByCreation = (lista) => {
    return [...lista].sort((a, b) => {
      const tsA = a.createdAt
        ? new Date(a.createdAt)
        : new Date(parseInt(String(a._id ?? a.id).slice(0, 8), 16) * 1000);
      const tsB = b.createdAt
        ? new Date(b.createdAt)
        : new Date(parseInt(String(b._id ?? b.id).slice(0, 8), 16) * 1000);
      return tsA - tsB;
    });
  };

  const fetchCargos = async () => {
    try {
      setLoading(true);
      const res = await getCargos();
      setCargos(sortByCreation(normalizeList(res)));
      setError(null);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar los cargos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCargos = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cargos;
    return cargos.filter((c) => {
      const codigo = String(c?.codigo ?? '').toLowerCase();
      const nombre = String(c?.nombre ?? '').toLowerCase();
      return codigo.includes(q) || nombre.includes(q);
    });
  }, [cargos, search]);

  const getId = (c) => c?._id ?? c?.id;

  const handleAdd = async (payload) => {
    const created = await createCargo(payload);
    const obj = created?.data?.data ?? created?.data ?? created;
    if (obj && (obj._id || obj.id)) {
      setCargos((prev) => sortByCreation([obj, ...prev]));
    } else {
      await fetchCargos();
    }
  };

  const handleUpdate = async (id, payload) => {
    const updated = await updateCargo(id, payload);
    const obj = updated?.data?.data ?? updated?.data ?? updated;
    if (obj && (obj._id || obj.id)) {
      setCargos((prev) => prev.map((c) => (getId(c) === id ? obj : c)));
    } else {
      await fetchCargos();
    }
  };

  const handleDelete = async (id) => {
    await deleteCargo(id);
    setCargos((prev) => prev.filter((c) => getId(c) !== id));
  };

  return (
    <DashboardLayout>
      <div className="territorial-wrapper">

        <CargosStats cargos={cargos} />

        {loading ? (
          <div className="territorial-loading">Cargando…</div>
        ) : error ? (
          <div className="territorial-error">{error}</div>
        ) : (
          <CargosTable
            cargos={filteredCargos}
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