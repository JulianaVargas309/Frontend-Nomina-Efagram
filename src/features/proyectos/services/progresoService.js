import httpClient from '../../../core/api/httpClient';
import { endpoints } from '../../../core/api/endpoints';

export const progresoService = {
  getProgresoProyecto: async (proyectoId) => {
    const response = await httpClient.get(endpoints.proyectos.progreso(proyectoId));
    return response.data;
  },

  getProgresoSubproyecto: async (subproyectoId) => {
    const response = await httpClient.get(endpoints.subproyectos.progreso(subproyectoId));
    return response.data;
  },

  crearRegistroDiario: async (data) => {
    const response = await httpClient.post('/registros-diarios-programacion', data);
    return response.data;
  },

  actualizarRegistroDiario: async (registroId, data) => {
    const response = await httpClient.put(`/registros-diarios-programacion/${registroId}`, data);
    return response.data;
  },
};
