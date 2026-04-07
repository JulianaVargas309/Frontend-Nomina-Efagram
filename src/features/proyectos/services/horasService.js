import httpClient from '../../../core/api/httpClient';

// Resumen de horas trabajadas y no trabajadas por cuadrilla de un subproyecto
export const getResumenHorasSubproyecto = (subproyectoId) => {
  return httpClient.get(`/horas-no-trabajadas/resumen/${subproyectoId}`);
};

// Registrar horas no trabajadas
export const registrarHorasNoTrabajadas = (data) => {
  return httpClient.post('/horas-no-trabajadas', data);
};

// Historial mensual de horas no trabajadas por subproyecto
export const getHorasNoTrabajadasMensual = ({ subproyectoId, mes, anio }) => {
  return httpClient.get('/horas-no-trabajadas/mensual', {
    params: { subproyectoId, mes, anio },
  });
};