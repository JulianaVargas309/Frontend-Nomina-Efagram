import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../app/layouts/DashboardLayout';
import ProcesosStats from '../components/ProcesosStats';
import ProcesosTable from '../components/ProcesosTable';
import {
  getProcesos,
  createProceso,
  updateProceso,
  deleteProceso,
} from '../services/procesosService';
import '../../territorial/territorial.css';

export default function CatalogoProcesosPage() {
  const [procesos, setProcesos] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeList = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const fetchProcesos = async () => {
    try {
      setLoading(true);
      const res = await getProcesos();
      setProcesos(normalizeList(res));
      setError(null);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar los procesos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProcesos = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return procesos;
    return procesos.filter((p) => {
      const codigo = String(p?.codigo ?? '').toLowerCase();
      const nombre = String(p?.nombre ?? '').toLowerCase();
      return codigo.includes(q) || nombre.includes(q);
    });
  }, [procesos, search]);

  const getId = (p) => p?._id ?? p?.id;

  const handleAdd = async (payload) => {
    const created = await createProceso(payload);
    const obj = created?.data ?? created;
    if (obj && (obj._id || obj.id)) {
      setProcesos((prev) => [obj, ...prev]);
    } else {
      await fetchProcesos();
    }
  };

  const handleUpdate = async (id, payload) => {
    const updated = await updateProceso(id, payload);
    const obj = updated?.data ?? updated;
    if (obj && (obj._id || obj.id)) {
      setProcesos((prev) => prev.map((p) => (getId(p) === id ? obj : p)));
    } else {
      await fetchProcesos();
    }
  };

  const handleDelete = async (id) => {
    await deleteProceso(id);
    setProcesos((prev) => prev.filter((p) => getId(p) !== id));
  };

  return (
    <DashboardLayout>
      <div className="territorial-wrapper">
        
        <ProcesosStats procesos={procesos} />

        {loading ? (
          <div className="territorial-loading">Cargando…</div>
        ) : error ? (
          <div className="territorial-error">{error}</div>
        ) : (
          <ProcesosTable
            procesos={filteredProcesos}
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