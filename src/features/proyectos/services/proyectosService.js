import httpClient from "../../../core/api/httpClient";
import { endpoints } from "../../../core/api/endpoints";

// ================= PROYECTOS =================

export const getProyectos = () => {
  return httpClient.get(endpoints.proyectos.getAll);
};

export const createProyecto = (data) => {
  return httpClient.post(endpoints.proyectos.create, data);
};

export const updateProyecto = (id, data) => {
  return httpClient.put(endpoints.proyectos.update(id), data);
};

export const deleteProyecto = (id) => {
  return httpClient.delete(endpoints.proyectos.delete(id));
};

// ================= PROGRESO DE PROYECTOS =================

export const getProgresoProyecto = (id) => {
  return httpClient.get(endpoints.proyectos.progreso(id));
};

export const getProgresoSubproyectos = (id) => {
  return httpClient.get(endpoints.proyectos.subproyectosProgreso(id));
};

export const getProgresosAll = () => {
  return httpClient.get(endpoints.proyectos.progresosAll);
};

export const getProgresoSubproyecto = (id) => {
  return httpClient.get(endpoints.subproyectos.progreso(id));
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

// ELIMINADO: getPrecios