import { useEffect, useState } from "react";
import {
  getActividades,
  deleteActividad
} from "../services/actividadesService";
import ActividadModal from "../components/ActividadModal";
import "../../../assets/styles/actividades.css";
import DashboardLayout from "../../../app/layouts/DashboardLayout";
import { ClipboardList, Tag, Pencil, Trash2, Search } from "lucide-react";

const getBadgeCategoria = (categoria = "") => {
  const map = {
    PREPARACION_TERRENO: "badge-preparacion",
    SIEMBRA: "badge-siembra",
    MANTENIMIENTO: "badge-mantenimiento",
    CONTROL_MALEZA: "badge-control",
    FERTILIZACION: "badge-fertilizacion",
    PODAS: "badge-podas",
    OTRO: "badge-default"
  };
  return map[categoria] || "badge-default";
};

const CatalogoActividadesPage = () => {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("activas");
  const [modalOpen, setModalOpen] = useState(false);
  const [actividadEditar, setActividadEditar] = useState(null);

  const cargarActividades = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtroEstado === "activas") params.activa = true;
      if (filtroEstado === "inactivas") params.activa = false;
      const res = await getActividades(params);
      setActividades(res?.data?.data || []);
    } catch (error) {
      console.error("Error cargando actividades", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarActividades(); }, [filtroEstado]);

  const actividadesFiltradas = actividades.filter((a) => {
    const q = busqueda.toLowerCase();
    return (
      a.codigo?.toLowerCase().includes(q) ||
      a.nombre?.toLowerCase().includes(q) ||
      a.categoria?.toLowerCase().includes(q)
    );
  });

  const abrirCrear = () => { setActividadEditar(null); setModalOpen(true); };
  const abrirEditar = (actividad) => { setActividadEditar(actividad); setModalOpen(true); };
  const cerrarModal = () => { setModalOpen(false); setActividadEditar(null); };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas desactivar esta actividad?")) return;
    try {
      await deleteActividad(id);
      cargarActividades();
    } catch (error) {
      console.error("Error eliminando actividad", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="catalogo-wrapper">

        {/* STATS */}
        <div className="catalogo-stats">
          <div className="stat-card">
            <div className="stat-card-icon">
              <ClipboardList size={20} color="#27ae60" strokeWidth={1.8} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-label">TOTAL ACTIVIDADES</span>
              <span className="stat-card-value">{actividades.length}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon">
              <Tag size={20} color="#27ae60" strokeWidth={1.8} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-label">CATEGORÍAS</span>
              <span className="stat-card-value">
                {new Set(actividades.map(a => a.categoria)).size}
              </span>
            </div>
          </div>
        </div>

        {/* PANEL */}
        <div className="catalogo-panel">

          <div className="catalogo-panel-header">
            <h2 className="catalogo-panel-title">Catálogo de Actividades</h2>
            <button className="btn-nueva-actividad" onClick={abrirCrear}>
              + Nueva Actividad
            </button>
          </div>

          <div className="catalogo-toolbar">
            <div className="search-wrapper">
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por código, nombre o categoría..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="activas">Activas</option>
              <option value="inactivas">Inactivas</option>
              <option value="todas">Todas</option>
            </select>
          </div>

          {loading ? (
            <div className="catalogo-loading">Cargando actividades...</div>
          ) : (
            <table className="tabla-actividades">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>NOMBRE</th>
                  <th>CATEGORÍA</th>
                  <th>UNIDAD</th>
                  <th>RENDIMIENTO</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {actividadesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="tabla-empty">
                      No se encontraron actividades
                    </td>
                  </tr>
                ) : (
                  actividadesFiltradas.map((a) => (
                    <tr key={a._id}>
                      <td>{a.codigo}</td>
                      <td>{a.nombre}</td>
                      <td>
                        <span className={`badge-categoria ${getBadgeCategoria(a.categoria)}`}>
                          {a.categoria}
                        </span>
                      </td>
                      <td>{a.unidad_medida}</td>
                      <td>{a.rendimiento_diario_estimado ?? "—"}</td>
                      <td>
                        <span className={`badge-estado ${a.activa ? "badge-activa" : "badge-inactiva"}`}>
                          {a.activa ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td>
                        <div className="acciones-cell">
                          <button
                            onClick={() => abrirEditar(a)}
                            title="Editar actividad"
                            style={{
                              width: 32, height: 32,
                              border: '1px solid #e2e8f0',
                              borderRadius: 8, cursor: 'pointer',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center', background: '#fff',
                            }}
                          >
                            <Pencil size={15} strokeWidth={1.8} color="#64748b" />
                          </button>
                          <button
                            onClick={() => handleEliminar(a._id)}
                            title="Desactivar actividad"
                            style={{
                              width: 32, height: 32,
                              border: '1px solid #e2e8f0',
                              borderRadius: 8, cursor: 'pointer',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center', background: '#fff',
                            }}
                          >
                            <Trash2 size={15} strokeWidth={1.8} color="#64748b" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <ActividadModal
          isOpen={modalOpen}
          onClose={cerrarModal}
          onSuccess={() => { cerrarModal(); cargarActividades(); }}
          actividadEditar={actividadEditar}
        />
      </div>
    </DashboardLayout>
  );
};

export default CatalogoActividadesPage;