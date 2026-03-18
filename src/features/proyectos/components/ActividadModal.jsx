import { useEffect, useReducer } from "react";
import { X } from "lucide-react";
import { createActividad, updateActividad } from "../services/actividadesService";
import { getIntervenciones } from "../services/intervencionesService";

// ── Estado inicial del formulario ─────────────────────────────────────────────
const INITIAL_STATE = {
  codigo:       "",
  nombre:       "",
  intervencion: "",
  activa:       "true",
  loading:      false,
  errors:       {},
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
        errors: { ...state.errors, [action.field]: null },
      };
    case "RESET":
      return { ...INITIAL_STATE, ...action.values };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_ERRORS":
      return { ...state, errors: action.value, loading: false };
    default:
      return state;
  }
}

// ── Estilos inline ────────────────────────────────────────────────────────────
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

const readOnlyStyle = {
  ...inputStyle(),
  background: "#f1f5f9",
  color: "#64748b",
  cursor: "not-allowed",
};

const selectStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "1.5px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  color: "#0f172a",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  cursor: "pointer",
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 5,
};

// ── Componente ────────────────────────────────────────────────────────────────
const ActividadModal = ({ isOpen, onClose, onSuccess, actividadEditar = null }) => {
  const isEdit = Boolean(actividadEditar);
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Solo intervenciones — fetch legítimo
  const [intervenciones, setIntervenciones] = useReducer(
    (_, list) => list,
    []
  );

  // Cargar intervenciones al abrir
  useEffect(() => {
    if (!isOpen) return;
    getIntervenciones()
      .then((res) => {
        let list = [];
        if (Array.isArray(res))                  list = res;
        else if (Array.isArray(res?.data))       list = res.data;
        else if (Array.isArray(res?.data?.data)) list = res.data.data;
        setIntervenciones(list.filter((i) => i.activo !== false));
      })
      .catch(() => setIntervenciones([]));
  }, [isOpen]);

  // Rellenar al editar — UN solo dispatch
  useEffect(() => {
    if (!isOpen) return;
    dispatch({
      type: "RESET",
      values: isEdit && actividadEditar
        ? {
            codigo:       actividadEditar.codigo       ?? "",
            nombre:       actividadEditar.nombre       ?? "",
            intervencion: actividadEditar.intervencion?._id
                          ?? actividadEditar.intervencion
                          ?? "",
            activa:       String(actividadEditar.activa ?? true),
          }
        : {},
    });
  }, [isOpen, actividadEditar]);

  if (!isOpen) return null;

  const setField = (field) => (e) =>
    dispatch({ type: "SET_FIELD", field, value: e.target.value });

  // Solo dígitos en el código
  const handleCodigo = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    dispatch({ type: "SET_FIELD", field: "codigo", value: val });
  };

  const handleSubmit = async () => {
    const errs = {};
    if (!state.codigo.trim()) errs.codigo = "El código es obligatorio";
    if (!state.nombre.trim()) errs.nombre = "El nombre es obligatorio";
    if (Object.keys(errs).length > 0) {
      dispatch({ type: "SET_ERRORS", value: errs });
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", value: true });

      const payload = {
        nombre:        state.nombre.trim(),
        activa:        state.activa === "true",
        unidad_medida: "HECTAREA",  // requerido por el backend
        categoria:     "OTRO",      // requerido por el backend
        intervencion:  state.intervencion || undefined,
      };

      if (isEdit) {
        await updateActividad(actividadEditar._id, payload);
      } else {
        // El backend guarda codigo como String uppercase
        await createActividad({ ...payload, codigo: String(state.codigo).trim() });
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      const serverMsg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.errors?.[0]?.msg     ||
        err?.response?.data?.message              ||
        err?.message                              ||
        "Error guardando la actividad";

      if (err?.response?.status === 409) {
        dispatch({ type: "SET_ERRORS", value: { codigo: "Este código ya está en uso" } });
      } else {
        dispatch({ type: "SET_ERRORS", value: { _general: serverMsg } });
      }
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, calc(100% - 24px))",
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 20px 60px rgba(15,23,42,0.2)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
              {isEdit ? "Editar Actividad" : "Nueva Actividad"}
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280" }}>
              Catálogo de actividades del sistema
            </p>
          </div>

          <button
            onClick={onClose}
            title="Cerrar"
            style={{
              background: "#f3f4f6",
              border: "1.5px solid #e5e7eb",
              borderRadius: 8,
              width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: "#374151",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.color = "#dc2626";
              e.currentTarget.style.borderColor = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.color = "#374151";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {state.errors._general && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 8, padding: "10px 14px",
              fontSize: 13, color: "#dc2626",
            }}>
              {state.errors._general}
            </div>
          )}

          {/* Código + Nombre */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div>
              <label style={labelStyle}>
                Código{!isEdit && <span style={{ color: "#dc2626" }}> *</span>}
              </label>
              <input
                value={state.codigo}
                onChange={handleCodigo}
                placeholder="Ej: 1"
                inputMode="numeric"
                readOnly={isEdit}
                style={isEdit ? readOnlyStyle : inputStyle(!!state.errors.codigo)}
                title={isEdit ? "El código no puede modificarse" : ""}
              />
              {state.errors.codigo && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#dc2626" }}>
                  {state.errors.codigo}
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>
                Nombre <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                value={state.nombre}
                onChange={setField("nombre")}
                placeholder="Nombre de la actividad"
                style={inputStyle(!!state.errors.nombre)}
              />
              {state.errors.nombre && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#dc2626" }}>
                  {state.errors.nombre}
                </p>
              )}
            </div>
          </div>

          {/* Intervención */}
          <div>
            <label style={labelStyle}>Intervención</label>
            <select
              value={state.intervencion}
              onChange={setField("intervencion")}
              style={selectStyle}
            >
              <option value="">— Sin intervención —</option>
              {intervenciones.map((i) => (
                <option key={i._id ?? i.id} value={i._id ?? i.id}>
                  {i.codigo} – {i.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label style={labelStyle}>Estado</label>
            <select
              value={state.activa}
              onChange={setField("activa")}
              style={selectStyle}
            >
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
            </select>
          </div>

        </div>

        {/* FOOTER */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
        }}>
          <button
            onClick={onClose}
            disabled={state.loading}
            style={{
              background: "#f9fafb", color: "#374151",
              border: "1px solid #d1d5db",
              padding: "10px 20px", borderRadius: 8,
              fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={state.loading}
            style={{
              background: state.loading ? "#9ca3af" : "#1f8f57",
              color: "#fff", border: "none",
              padding: "10px 24px", borderRadius: 8,
              fontWeight: 700,
              cursor: state.loading ? "not-allowed" : "pointer",
              fontSize: 14,
              boxShadow: state.loading ? "none" : "0 4px 12px rgba(31,143,87,0.25)",
            }}
          >
            {state.loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActividadModal;