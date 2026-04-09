import { useEffect, useState } from "react";
import {
  createIntervencion,
  updateIntervencion,
} from "../services/intervencionesService";

const generarCodigoIntervencion = (intervenciones = []) => {
  if (!Array.isArray(intervenciones) || intervenciones.length === 0) {
    return "INT-001";
  }

  let max = 0;

  intervenciones.forEach((i) => {
    const codigo = String(i?.codigo || "").trim().toUpperCase();
    const match = codigo.match(/^INT-(\d+)$/);
    if (!match) return;

    const numero = parseInt(match[1], 10);
    if (!isNaN(numero) && numero > max) {
      max = numero;
    }
  });

  return `INT-${String(max + 1).padStart(3, "0")}`;
};

const IntervencionModal = ({
  show,
  onClose,
  intervencionEditar,
  onSuccess,
  intervencionesActuales = [],
}) => {
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    procesos: "",
    estado: "Activo",
    descripcion: "",
  });

  const isEdit = Boolean(intervencionEditar);

  useEffect(() => {
    if (!show) return;

    if (isEdit && intervencionEditar) {
      setForm({
        codigo: intervencionEditar.codigo || "",
        nombre: intervencionEditar.nombre || "",
        procesos: intervencionEditar.procesos || "",
        estado: intervencionEditar.estado || "Activo",
        descripcion: intervencionEditar.descripcion || "",
      });
    } else {
      setForm({
        codigo: generarCodigoIntervencion(intervencionesActuales),
        nombre: "",
        procesos: "",
        estado: "Activo",
        descripcion: "",
      });
    }
  }, [show, isEdit, intervencionEditar, intervencionesActuales]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (intervencionEditar) {
        await updateIntervencion(intervencionEditar.id, form);
      } else {
        await createIntervencion({
          ...form,
          codigo: form.codigo.trim().toUpperCase(),
        });
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("Error guardando intervención:", error);
    }
  };

  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {intervencionEditar ? "Editar" : "Nueva"} Intervención
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Código *</label>
                <input
                  type="text"
                  className="form-control"
                  name="codigo"
                  value={form.codigo}
                  placeholder="Código generado automáticamente"
                  readOnly
                  disabled
                  style={{
                    background: "#f8fafc",
                    color: "#475569",
                    cursor: "not-allowed",
                    fontWeight: 600,
                    letterSpacing: 1,
                  }}
                  required
                />
                <small className="text-muted">
                  El código se genera automáticamente
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className="form-control"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Procesos *</label>
                <input
                  type="text"
                  className="form-control"
                  name="procesos"
                  value={form.procesos}
                  onChange={handleChange}
                  placeholder="Ej: Proceso 1, Proceso 2"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Estado *</label>
                <select
                  className="form-select"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  required
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IntervencionModal;