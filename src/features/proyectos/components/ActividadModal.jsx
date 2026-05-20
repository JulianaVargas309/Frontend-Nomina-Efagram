import { useEffect, useState } from "react";
import {
  Sparkles,
  Hash,
  Type,
  GitBranch,
  ToggleLeft,
  FileText
} from "lucide-react";
import {
  getActividades,
  createActividad,
  updateActividad
} from "../services/actividadesService";
import { getIntervenciones } from "../services/intervencionesService";

const FORM_INICIAL = {
  codigo: "",
  nombre: "",
  intervencion: "",
  activa: "true",
  descripcion: "",
};

const normalizeList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const padActividadNumber = (value) => String(value).padStart(3, "0");

export const getNextActividadCode = (actividades = [], prefijo = "ACT") => {
  const maxNumber = actividades.reduce((acc, item) => {
    const code = String(item?.codigo || "").trim().toUpperCase();
    const match = code.match(/(\d+)$/);
    if (!match) return acc;

    const current = Number(match[1]);
    if (Number.isNaN(current)) return acc;

    return Math.max(acc, current);
  }, 0);

  return `${prefijo}-${padActividadNumber(maxNumber + 1)}`;
};

const inputStyle = (hasError = false) => ({
  width: "100%",
  padding: "9px 12px",
  border: `1.5px solid ${hasError ? "#dc2626" : "#d1d5db"}`,
  borderRadius: 8,
  fontSize: 14,
  color: "#0f172a",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
});

const readOnlyInputStyle = {
  ...inputStyle(),
  background: "#f1f5f9",
  color: "#64748b",
  cursor: "not-allowed",
  fontWeight: 600,
  letterSpacing: 1,
};

const selectStyle = (hasError = false) => ({
  width: "100%",
  padding: "9px 12px",
  border: `1.5px solid ${hasError ? "#dc2626" : "#d1d5db"}`,
  borderRadius: 8,
  fontSize: 14,
  color: "#0f172a",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  cursor: "pointer",
});

const labelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

const ActividadModal = ({ isOpen, onClose, onSuccess, actividadEditar = null }) => {
  const isEdit = Boolean(actividadEditar);

  const [form, setForm] = useState(FORM_INICIAL);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [intervenciones, setIntervenciones] = useState([]);
  const [loadingIntervenciones, setLoadingIntervenciones] = useState(false);
  const [actividadesActuales, setActividadesActuales] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    const cargarIntervenciones = async () => {
      try {
        setLoadingIntervenciones(true);
        const res = await getIntervenciones();
        const lista = (res?.data?.data ?? res?.data ?? []).filter((i) => i.activo !== false);
        setIntervenciones(lista);
      } catch (error) {
        console.error("Error cargando intervenciones", error);
      } finally {
        setLoadingIntervenciones(false);
      }
    };

    cargarIntervenciones();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isEdit) return;

    const cargarActividadesExistentes = async () => {
      try {
        const res = await getActividades();
        const lista = normalizeList(res);
        setActividadesActuales(lista);
      } catch (error) {
        console.error("Error cargando actividades existentes", error);
        setActividadesActuales([]);
      }
    };

    cargarActividadesExistentes();
  }, [isOpen, isEdit]);

  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && actividadEditar) {
      setForm({
        codigo: actividadEditar.codigo ?? "",
        nombre: actividadEditar.nombre ?? "",
        intervencion: actividadEditar.intervencion?._id ?? actividadEditar.intervencion ?? "",
        activa: String(actividadEditar.activa ?? true),
        descripcion: actividadEditar.descripcion ?? "",
      });
    } else {
      setForm({
        codigo: getNextActividadCode(actividadesActuales, "ACT"),
        nombre: "",
        intervencion: "",
        activa: "true",
        descripcion: "",
      });
    }

    setErrors({});
  }, [isOpen, actividadEditar, isEdit, actividadesActuales]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!form.codigo.trim()) errs.codigo = "El código es obligatorio";
    if (!form.nombre.trim()) errs.nombre = "El nombre es obligatorio";
    if (!form.intervencion) errs.intervencion = "Debes seleccionar una intervención";

    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        nombre: form.nombre.trim(),
        intervencion: form.intervencion,
        activa: form.activa === "true",
        descripcion: form.descripcion.trim(),
      };

      if (isEdit) {
        await updateActividad(actividadEditar._id, payload);
      } else {
        await createActividad({
          ...payload,
          codigo: form.codigo.trim().toUpperCase(),
        });
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      const serverMsg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        err?.response?.data?.message ||
        err?.message ||
        "Error guardando la actividad";

      if (err?.response?.status === 409) {
        setErrors({ codigo: "Este código ya está en uso" });
      } else {
        setErrors({ _general: serverMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, calc(100% - 24px))",
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(15,23,42,0.2)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(139, 92, 246, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} color="#8b5cf6" strokeWidth={1.5} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
                {isEdit ? "Editar Actividad" : "Nueva Actividad"}
              </h3>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280" }}>
                Catálogo de actividades por intervención
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Cerrar"
            style={{
              background: "#e5e7eb",
              border: "1.5px solid #d1d5db",
              borderRadius: 8,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              marginLeft: 12,
              fontSize: 18,
              fontWeight: 700,
              color: "#374151",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {errors._general && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#dc2626",
                marginBottom: 16,
              }}
            >
              {errors._general}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: 16,
            }}
          >
            <div style={{ flex: "1 1 100%", minWidth: "140px" }}>
              <label style={labelStyle}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(59, 130, 246, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Hash size={16} color="#3b82f6" strokeWidth={1} />
                </div>
                Código <span style={{ color: "#dc2626" }}>*</span>
              </label>

              <input
                name="codigo"
                value={form.codigo}
                placeholder="Código generado automáticamente"
                readOnly
                disabled
                style={readOnlyInputStyle}
                title="El código se genera automáticamente"
              />
              {errors.codigo && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#dc2626" }}>
                  {errors.codigo}
                </p>
              )}
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
                El código se genera automáticamente
              </p>
            </div>

            <div style={{ flex: "1 1 100%", minWidth: "140px" }}>
              <label style={labelStyle}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Type size={16} color="#10b981" strokeWidth={1} />
                </div>
                Nombre <span style={{ color: "#dc2626" }}>*</span>
              </label>

              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Nombre de la actividad"
                style={inputStyle(!!errors.nombre)}
              />
              {errors.nombre && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#dc2626" }}>
                  {errors.nombre}
                </p>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: 16,
            }}
          >
            <div style={{ flex: "1 1 100%", minWidth: "140px" }}>
              <label style={labelStyle}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(245, 158, 11, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GitBranch size={16} color="#f59e0b" strokeWidth={1} />
                </div>
                Intervención <span style={{ color: "#dc2626" }}>*</span>
              </label>

              <select
                name="intervencion"
                value={form.intervencion}
                onChange={handleChange}
                style={selectStyle(!!errors.intervencion)}
                disabled={loadingIntervenciones}
              >
                <option value="">
                  {loadingIntervenciones ? "Cargando..." : "Seleccione una intervención"}
                </option>
                {intervenciones.map((intervencion) => (
                  <option key={intervencion._id} value={intervencion._id}>
                    {intervencion.codigo} · {intervencion.nombre}
                  </option>
                ))}
              </select>

              {errors.intervencion && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#dc2626" }}>
                  {errors.intervencion}
                </p>
              )}
            </div>

            <div style={{ flex: "1 1 100%", minWidth: "140px" }}>
              <label style={labelStyle}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background:
                      form.activa === "true"
                        ? "rgba(16, 185, 129, 0.1)"
                        : "rgba(239, 68, 68, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ToggleLeft
                    size={16}
                    color={form.activa === "true" ? "#10b981" : "#ef4444"}
                    strokeWidth={1}
                  />
                </div>
                Estado
              </label>

              <select
                name="activa"
                value={form.activa}
                onChange={handleChange}
                style={selectStyle()}
              >
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(99, 102, 241, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={16} color="#6366f1" strokeWidth={1} />
              </div>
              Descripción
            </label>

            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Descripción detallada de la actividad..."
              rows={4}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1.5px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                color: "#0f172a",
                background: "#fff",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: "#f9fafb",
              color: "#374151",
              border: "1px solid #d1d5db",
              padding: "10px 20px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: loading ? "#9ca3af" : "#1f8f57",
              color: "#fff",
              border: "none",
              padding: "10px 24px",
              borderRadius: 8,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
              boxShadow: loading ? "none" : "0 4px 12px rgba(31,143,87,0.25)",
            }}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActividadModal;