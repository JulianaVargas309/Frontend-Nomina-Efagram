// ==========================================
// SERVICIO: PROGRAMACIÓN
// ==========================================
// Descripción: Llamadas a API para programaciones
// Ubicación: src/features/programacion/services/programacionService.js

import httpClient from '../../../core/api/httpClient';

export const programacionService = {
  // ────────────────────────────────────────────────────────────────
  // PROGRAMACIONES
  // ────────────────────────────────────────────────────────────────

  // Obtener todas las programaciones
  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get('/programaciones', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener programaciones activas
  getActivas: async () => {
    try {
      const response = await httpClient.get('/programaciones/activas');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener programación por ID
  getById: async (id) => {
    try {
      const response = await httpClient.get(`/programaciones/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener resumen de programación (con registros diarios)
  getResumen: async (id) => {
    try {
      const response = await httpClient.get(`/programaciones/${id}/resumen`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener programaciones por contrato
  getPorContrato: async (contratoId) => {
    try {
      const response = await httpClient.get(`/programaciones/contrato/${contratoId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Crear nueva programación
  create: async (data) => {
    try {
      const response = await httpClient.post('/programaciones', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Actualizar programación
  update: async (id, data) => {
    try {
      const response = await httpClient.put(`/programaciones/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Eliminar programación
  delete: async (id) => {
    try {
      const response = await httpClient.delete(`/programaciones/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ────────────────────────────────────────────────────────────────
  // REGISTROS DIARIOS
  // ────────────────────────────────────────────────────────────────

  // Obtener registros diarios de una programación
  getRegistrosDiarios: async (programacionId) => {
    try {
      const response = await httpClient.get(
        `/registros-diarios-programacion/semana/${programacionId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener un registro diario específico
  getRegistroDiarioById: async (id) => {
    try {
      const response = await httpClient.get(`/registros-diarios-programacion/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Crear registro diario
  createRegistroDiario: async (data) => {
    try {
      const response = await httpClient.post(
        '/registros-diarios-programacion',
        data
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Actualizar un registro diario
  updateRegistroDiario: async (id, data) => {
    try {
      const response = await httpClient.put(
        `/registros-diarios-programacion/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ⭐ IMPORTANTE: Actualizar múltiples registros (para el modal)
  updateMultiplesRegistros: async (registros) => {
    try {
      const response = await httpClient.post(
        '/registros-diarios-programacion/actualizar-multiples',
        { registros }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener estadísticas de una programación
  getEstadisticas: async (programacionId) => {
    try {
      const response = await httpClient.get(
        `/registros-diarios-programacion/estadisticas/${programacionId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Validar un registro diario
  validarRegistro: async (id) => {
    try {
      const response = await httpClient.put(
        `/registros-diarios-programacion/${id}/validar`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Eliminar registro diario
  deleteRegistroDiario: async (id) => {
    try {
      const response = await httpClient.delete(
        `/registros-diarios-programacion/${id}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default programacionService;