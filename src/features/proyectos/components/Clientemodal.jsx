import { useEffect, useReducer } from "react";
import { createCliente, updateCliente } from "../services/Clientesservice";

// ── Estilos ───────────────────────────────────────────────────────────────────
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

// ── Estado ────────────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  codigo:  "",
  nombre:  "",
  activo:  "true",
  loading: false,
  errors:  {},
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

// ── Componente ────────────────────────────────────────────────────────────────
const ClienteModal = ({ isOpen, onClose, onSuccess, cliente = null }) => {
  const isEdit = Boolean(cliente);
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // UN solo dispatch — sin renders en cascada
  useEffect(() => {
    if (!isOpen) return;
    dispatch({
      type: "RESET",
      values: isEdit && cliente
        ? {
            codigo: cliente.codigo      ?? "",
            nombre: cliente.razon_social ?? cliente.nombre ?? "",
            activo: String(cliente.activo ?? true),
          }
        : {},
    });
  }, [isOpen, cliente]);

  if (!isOpen) return null;

  const setField = (field) => (e) =>
    dispatch({ type: "SET_FIELD", field, value: e.target.value });

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
        // El backend requiere razon_social y nit — los derivamos del nombre y código
        razon_social: state.nombre.trim(),
        nit:          state.codigo.trim(),   // usamos el código como NIT
        activo:       state.activo === "true",
      };

      if (isEdit) {
        await updateCliente(cliente._id, payload);
      } else {
        await createCliente({
          ...payload,
          codigo: state.codigo.trim().toUpperCase(),
        });
      }

      onSuccess?.();
      onClose?.();

    } catch (err) {
      const serverMsg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.errors?.[0]?.msg     ||
        err?.response?.data?.message              ||
        err?.message                              ||
        "Error guardando el cliente";

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
          width: "min(440px, calc(100% - 24px))",
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
              {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280" }}>
              {isEdit ? "Actualiza los datos del cliente" : "Completa los datos del cliente"}
            </p>
          </div>
          <button
            onClick={onClose}
            title="Cerrar"
            style={{
              background: "none", border: "1px solid #e5e7eb",
              borderRadius: 7, width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 18, color: "#6b7280", lineHeight: 1,
            }}
          >
            ×
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

          {/* Código */}
          <div>
            <label style={labelStyle}>
              Código{!isEdit && <span style={{ color: "#dc2626" }}> *</span>}
            </label>
            <input
              value={state.codigo}
              onChange={setField("codigo")}
              placeholder="Ej: CLI-001"
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

          {/* Nombre */}
          <div>
            <label style={labelStyle}>
              Nombre <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              value={state.nombre}
              onChange={setField("nombre")}
              placeholder="Nombre del cliente"
              style={inputStyle(!!state.errors.nombre)}
            />
            {state.errors.nombre && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#dc2626" }}>
                {state.errors.nombre}
              </p>
            )}
          </div>

          {/* Estado */}
          <div>
            <label style={labelStyle}>Estado</label>
            <select value={state.activo} onChange={setField("activo")} style={selectStyle}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
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
            {state.loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear Cliente"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClienteModal;