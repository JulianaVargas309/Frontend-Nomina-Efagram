import { useEffect, useState } from "react";
import { createProyecto } from "../services/proyectosService";
import { getClientes } from "@/modules/clientes/clientes/services/clientesService";
import { getPersonas } from "@/personal/services/personalService";

const ProyectoModal = ({ isOpen, onClose, onSuccess }) => {
  const [clientes, setClientes] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const initialForm = {
    codigo: "",
    nombre: "",
    cliente: "",
    responsable: "",
    fecha_inicio: "",
    fecha_fin_estimada: "",
    tipo_contrato: "FIJO_TODO_COSTO",
  };

  const [form, setForm] = useState(initialForm);

  // ===================================================
  // CARGAR CLIENTES Y PERSONAS
  // ===================================================
  useEffect(() => {
    if (!isOpen) return;

    const cargarDatos = async () => {
      try {
        setLoadingData(true);

        const [clientesRes, personasRes] = await Promise.all([
          getClientes(),
          getPersonas(),
        ]);

        // 🔥 Manejo blindado de estructura
        const clientesData =
          clientesRes?.data?.data ||
          clientesRes?.data ||
          [];

        const personasData =
          personasRes?.data?.data ||
          personasRes?.data ||
          [];

        setClientes(Array.isArray(clientesData) ? clientesData : []);
        setPersonas(Array.isArray(personasData) ? personasData : []);
      } catch (error) {
        console.error("Error cargando datos:", error);
        setClientes([]);
        setPersonas([]);
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, [isOpen]);

  // ===================================================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ===================================================
  const handleSubmit = async () => {
    if (!form.codigo || !form.nombre || !form.cliente) {
      alert("Código, nombre y cliente son obligatorios");
      return;
    }

    try {
      setLoading(true);

      await createProyecto(form);

      onSuccess?.();
      setForm(initialForm);
      onClose?.();
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.errors?.[0]?.msg ||
        err?.response?.data?.message ||
        "Error creando proyecto"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">

        <h3>Nuevo Proyecto</h3>

        {/* CODIGO */}
        <input
          name="codigo"
          placeholder="Código"
          value={form.codigo}
          onChange={handleChange}
        />

        {/* NOMBRE */}
        <input
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
        />

        {/* CLIENTE */}
        <select
          name="cliente"
          value={form.cliente}
          onChange={handleChange}
        >
          <option value="">
            {loadingData ? "Cargando clientes..." : "Seleccione cliente"}
          </option>

          {clientes.map((cliente) => (
            <option key={cliente._id} value={cliente._id}>
              {cliente.nombre ||
                cliente.razon_social ||
                cliente.razonSocial ||
                "Cliente"}
            </option>
          ))}
        </select>

        {/* RESPONSABLE */}
        <select
          name="responsable"
          value={form.responsable}
          onChange={handleChange}
        >
          <option value="">
            {loadingData ? "Cargando responsables..." : "Seleccione responsable"}
          </option>

          {personas.map((persona) => (
            <option key={persona._id} value={persona._id}>
              {`${persona.nombres || ""} ${persona.apellidos || ""}`.trim() ||
                persona.nombre ||
                "Persona"}
            </option>
          ))}
        </select>

        {/* FECHA INICIO */}
        <input
          type="date"
          name="fecha_inicio"
          value={form.fecha_inicio}
          onChange={handleChange}
        />

        {/* FECHA FIN */}
        <input
          type="date"
          name="fecha_fin_estimada"
          value={form.fecha_fin_estimada}
          onChange={handleChange}
        />

        {/* TIPO CONTRATO */}
        <select
          name="tipo_contrato"
          value={form.tipo_contrato}
          onChange={handleChange}
        >
          <option value="FIJO_TODO_COSTO">Fijo todo costo</option>
          <option value="ADMINISTRACION">Administración</option>
          <option value="VARIABLE">Variable</option>
          <option value="CONTRATO_ESPECIAL">Contrato especial</option>
          <option value="OTRO">Otro</option>
        </select>

        {/* BOTONES */}
        <div className="modal-buttons">
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </button>

          <button onClick={onClose} disabled={loading}>
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProyectoModal;
