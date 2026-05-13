import httpClient from "../../../core/api/httpClient";
import { endpoints } from "../../../core/api/endpoints";

// ================= TRANSFORMADORES (objetos embebidos) =================

const buildProyectoPayload = (data = {}) => ({
  ...data,

  responsable: data.responsable
    ? { nombre: data.responsable.nombre ?? data.responsable }
    : undefined,

  zona: data.zona
    ? { nombre: data.zona.nombre ?? data.zona }
    : undefined,

  cliente: data.cliente
    ? { nombre: data.cliente.nombre ?? data.cliente }
    : undefined,

  fincas: (data.fincas || []).map(f => ({
    nombre: f?.nombre ?? f,
    codigo: f?.codigo ?? "",
  })),

  personal: (data.personal || []).map(p => ({
    nombre: p?.nombre ?? p,
    documento: p?.documento ?? "",
  })),

  zonas: (data.zonas || []).map(z => ({
    nombre: z?.nombre ?? z,
  })),

  nucleos: (data.nucleos || []).map(n => ({
    nombre: n?.nombre ?? n,
  })),

  actividades: (data.actividades || []).map(a => ({
    actividad: {
      nombre: a?.actividad?.nombre ?? a?.actividad ?? "",
    },
    asignacion_subproyecto: {
      nombre: a?.asignacion_subproyecto?.nombre ?? a?.asignacion_subproyecto ?? "",
    },
    cantidad: Number(a?.cantidad || 0),
    precio_unitario: Number(a?.precio_unitario || 0),
  })),
});

// ================= PROYECTOS =================

export const getProyectos = () => {
  return httpClient.get(endpoints.proyectos.getAll);
};

export const createProyecto = (data) => {
  const payload = buildProyectoPayload(data);
  return httpClient.post(endpoints.proyectos.create, payload);
};

export const updateProyecto = (id, data) => {
  const payload = buildProyectoPayload(data);
  return httpClient.put(endpoints.proyectos.update(id), payload);
};

export const deleteProyecto = (id) => {
  return httpClient.delete(endpoints.proyectos.delete(id));
};

// ================= CLIENTES =================

export const getClientes = () => {
  return httpClient.get(endpoints.clientes.getAll);
};

export const createCliente = (data) => {
  return httpClient.post(endpoints.clientes.create, data);
};

// ================= ACTIVIDADES =================

export const getCatalogoActividades = () => {
  return httpClient.get(endpoints.actividades.getAll);
};