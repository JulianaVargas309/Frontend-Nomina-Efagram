import httpClient from '../../../core/api/httpClient';

// Obtener resumen de horas por subproyecto (cuadrillas)
export const getResumenHorasSubproyecto = (subproyectoId) => {
  return httpClient.get(`/horas-no-trabajadas/resumen/${subproyectoId}`);
};