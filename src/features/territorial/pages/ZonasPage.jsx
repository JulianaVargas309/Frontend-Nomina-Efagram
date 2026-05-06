import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../app/layouts/DashboardLayout';
import TerritorialStats from '../components/nueva-zona/TerritorialStats';
import ZonasTable from '../components/nueva-zona/ZonasTable';
import {
  getZonas,
  createZona,
  updateZona,
  deleteZona,
} from '../services/zonas.service';
import '../territorial.css';

export default function ZonasPage() {
  const [zonas, setZonas] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeList = (res) => {
    if (Array.isArray(res?.zonas)) return res.zonas;
    return [];
  };

  const fetchZonas = async () => {
    try {
      setLoading(true);
      const res = await getZonas();
      setZonas(normalizeList(res));
      setError(null);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar las zonas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZonas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredZonas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return zonas;
    return zonas.filter((z) => {
      const codigo = String(z?.codeZona ?? '').toLowerCase();
      const nombre = String(z?.nombreZona ?? '').toLowerCase();
      return codigo.includes(q) || nombre.includes(q);
    });
  }, [zonas, search]);

  const getId = (z) => z?._id ?? z?.id;

  const handleAdd = async (payload) => {
  try {
    const response = await createZona(payload);
    const newZona = response?.data ?? response;
    await fetchZonas(); 
    console.log('Zona creada exitosamente:', newZona);
    
    return newZona;
  } catch (error) {
    console.error('Error al crear zona:', error);
    throw error;
  }
};

  

const handleUpdate = async (id, payload) => {
  const updated = await updateZona(id, payload);
  const obj = updated?.data ?? updated?.zonas ?? updated;
  if (obj && (obj._id || obj.id)) {
    setZonas((prev) => prev.map((z) => (getId(z) === id ? obj : z)));
  } else {
    await fetchZonas();
  }
};


  const handleDelete = async (id) => {
    await deleteZona(id);
    setZonas((prev) => prev.filter((z) => getId(z) !== id));
  };

  return (
    <DashboardLayout>
      <div className="territorial-wrapper">


        <TerritorialStats zonas={zonas} />

        {loading ? (
          <div className="territorial-loading">Cargando…</div>
        ) : error ? (
          <div className="territorial-error">{error}</div>
        ) : (
          <ZonasTable
            zonas={filteredZonas}
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
