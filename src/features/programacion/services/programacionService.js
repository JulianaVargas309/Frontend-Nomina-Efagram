// ==========================================
// SERVICIO: PROGRAMACIÓN
// ==========================================

import httpClient from '../../../core/api/httpClient';

// ================= TRANSFORMADOR =================
// El modal envía { contrato: { codigo, nombre }, fecha_inicial, ... }
// Esta función asegura que el payload siempre llegue en formato embebido.

const buildProgramacionPayload = (data = {}) => {
  const payload = { ...data };

  // contrato: si viene como objeto { codigo, nombre } lo respeta;
  // si viene como contrato_id (string) lo convierte a objeto mínimo.
  if (data.contrato && typeof data.contrato === 'object') {
    payload.contrato = {
      codigo: data.contrato.codigo ?? "",
      nombre: data.contrato.nombre ?? "",
    };
  } else if (data.contrato_id) {
    payload.contrato = {
      codigo: data._contratoObj?.codigo ?? "",
      nombre: data._contratoObj?.nombre ?? data.contrato_id,
    };
    delete payload.contrato_id;
    delete payload._contratoObj;
  }

  payload.fincas = (data.fincas || []).map(f => ({
    nombre: f?.nombre ?? f,
    codigo: f?.codigo ?? "",
  }));

  payload.personal = (data.personal || []).map(p => ({
    nombre: p?.nombre ?? p,
    documento: p?.documento ?? "",
  }));

  payload.zonas = (data.zonas || []).map(z => ({
    nombre: z?.nombre ?? z,
  }));

  payload.nucleos = (data.nucleos || []).map(n => ({
    nombre: n?.nombre ?? n,
  }));

  payload.actividades = (data.actividades || []).map(a => ({
    actividad: {
      nombre: a?.actividad?.nombre ?? a?.actividad ?? "",
    },
    asignacion_subproyecto: {
      nombre: a?.asignacion_subproyecto?.nombre ?? a?.asignacion_subproyecto ?? "",
    },
    cantidad: Number(a?.cantidad || 0),
    precio_unitario: Number(a?.precio_unitario || 0),
  }));

  return payload;
};

export const programacionService = {
  // ────────────────────────────────────────────────────────────────
  // PROGRAMACIONES
  // ────────────────────────────────────────────────────────────────

  getAll: async (params = {}) => {
    try {
      const response = await httpClient.get('/programaciones', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getActivas: async () => {
    try {
      const response = await httpClient.get('/programaciones/activas');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getById: async (id) => {
    try {
      const response = await httpClient.get(`/programaciones/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getResumen: async (id) => {
    try {
      const response = await httpClient.get(`/programaciones/${id}/resumen`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getPorContrato: async (contratoId) => {
    try {
      const response = await httpClient.get(`/programaciones/contrato/${contratoId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ⭐ CAMBIADO: transforma el payload antes de enviarlo
  create: async (data) => {
    try {
      const payload = buildProgramacionPayload(data);
      const response = await httpClient.post('/programaciones', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ⭐ CAMBIADO: transforma el payload antes de enviarlo
  update: async (id, data) => {
    try {
      const payload = buildProgramacionPayload(data);
      const response = await httpClient.put(`/programaciones/${id}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

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

  getRegistroDiarioById: async (id) => {
    try {
      const response = await httpClient.get(`/registros-diarios-programacion/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createRegistroDiario: async (data) => {
    try {
      const response = await httpClient.post('/registros-diarios-programacion', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

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