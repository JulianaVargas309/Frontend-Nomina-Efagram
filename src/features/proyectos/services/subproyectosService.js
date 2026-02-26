import httpClient from '../../../core/api/httpClient';

// ─── Actividades del proyecto ───────────────────────────────────────
export const getActividadesProyecto = (params) =>
  httpClient.get('/actividades-proyecto', { params });

export const getActividadesDisponibles = (proyectoId, params) =>
  httpClient.get(`/actividades-proyecto/disponibles/${proyectoId}`, { params });

export const createActividadProyecto = (data) =>
  httpClient.post('/actividades-proyecto', data);

export const updateActividadProyecto = (id, data) =>
  httpClient.put(`/actividades-proyecto/${id}`, data);

export const deleteActividadProyecto = (id) =>
  httpClient.delete(`/actividades-proyecto/${id}`);

// ─── Subproyectos ───────────────────────────────────────────────────
export const getSubproyectos = (params) =>
  httpClient.get('/subproyectos', { params });

export const getSubproyecto = (id) =>
  httpClient.get(`/subproyectos/${id}`);

export const createSubproyecto = (data) =>
  httpClient.post('/subproyectos', data);

export const updateSubproyecto = (id, data) =>
  httpClient.put(`/subproyectos/${id}`, data);

export const deleteSubproyecto = (id) =>
  httpClient.delete(`/subproyectos/${id}`);

export const getNucleosDisponibles = (subproyectoId) =>
  httpClient.get(`/subproyectos/${subproyectoId}/nucleos-disponibles`);

// ─── Asignaciones ───────────────────────────────────────────────────
export const getAsignaciones = (params) =>
  httpClient.get('/asignaciones', { params });

export const createAsignacion = (data) =>
  httpClient.post('/asignaciones', data);

export const updateAsignacion = (id, data) =>
  httpClient.put(`/asignaciones/${id}`, data);

export const cancelarAsignacion = (id) =>
  httpClient.delete(`/asignaciones/${id}`);