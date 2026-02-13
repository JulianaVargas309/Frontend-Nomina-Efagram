import { useEffect, useState } from "react";
import {
  getProyectos,
  deleteProyecto,
} from "../services/proyectosService";
import "../../../assets/styles/proyectos.css";
import ProyectoModal from "../components/ProyectoModal";

const ProyectosPage = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // =========================================
  // CARGAR PROYECTOS
  // =========================================
  const cargarProyectos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getProyectos();

      if (response?.data?.success) {
        setProyectos(response.data.data);
      } else {
        setProyectos([]);
      }
    } catch (err) {
      console.error("Error cargando proyectos:", err);
      setError("No se pudieron cargar los proyectos.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // ELIMINAR PROYECTO
  // =========================================
  const handleDelete = async (id) => {
    const confirmacion = window.confirm(
      "¿Seguro que deseas eliminar este proyecto?"
    );

    if (!confirmacion) return;

    try {
      setDeletingId(id);

      await deleteProyecto(id);

      // Recargar desde backend (más seguro que filtrar local)
      await cargarProyectos();
    } catch (err) {
      console.error("Error eliminando proyecto:", err);

      alert(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudo eliminar el proyecto"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================
  // EFECTO INICIAL
  // =========================================
  useEffect(() => {
    cargarProyectos();
  }, []);

  // =========================================
  // RENDER
  // =========================================
  return (
    <div className="proyectos-container">
      <div className="header-proyectos">
        <h2>Proyectos</h2>

        <button
          className="btn-crear"
          onClick={() => setOpenModal(true)}
        >
          + Nuevo Proyecto
        </button>
      </div>

      {loading && <p>Cargando proyectos...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && proyectos.length === 0 && (
        <p>No hay proyectos registrados.</p>
      )}

      {proyectos.length > 0 && (
        <table className="proyectos-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Fecha Inicio</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {proyectos.map((proyecto) => (
              <tr key={proyecto._id}>
                <td>{proyecto.nombre}</td>

                <td>{proyecto.cliente?.nombre || "-"}</td>

                <td>{proyecto.estado}</td>

                <td>
                  {proyecto.fecha_inicio
                    ? new Date(
                        proyecto.fecha_inicio
                      ).toLocaleDateString()
                    : "-"}
                </td>

                <td>
                  <button
                    onClick={() =>
                      handleDelete(proyecto._id)
                    }
                    className="btn-eliminar"
                    disabled={deletingId === proyecto._id}
                  >
                    {deletingId === proyecto._id
                      ? "Eliminando..."
                      : "Eliminar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ===========================
          MODAL CREAR PROYECTO
         =========================== */}

      <ProyectoModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() => {
          setOpenModal(false);
          cargarProyectos();
        }}
      />
    </div>
  );
};

export default ProyectosPage;
