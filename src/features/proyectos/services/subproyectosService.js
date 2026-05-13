import httpClient from '../../../core/api/httpClient';

// ================= TRANSFORMADORES (objetos embebidos) =================

const buildSubproyectoPayload = (data = {}) => ({
  ...data,
  supervisor: data?.supervisor
    ? { nombre: typeof data.supervisor === 'string' ? data.supervisor : data.supervisor.nombre ?? data.supervisor }
    : undefined,
  nucleos: (data.nucleos || []).map(n => ({
    nombre: typeof n === 'string' ? n : n?.nombre ?? n,
  })),
});

const buildCuadrillaPayload = (data = {}) => ({
  ...data,
  cuadrillas: (data.cuadrillas || []).map(c => ({
    nombre: typeof c === 'string' ? c : c?.nombre ?? c,
  })),
  supervisor: data?.supervisor
    ? { nombre: typeof data.supervisor === 'string' ? data.supervisor : data.supervisor.nombre ?? data.supervisor }
    : undefined,
  personal: (data.personal || []).map(p => ({
    nombre: typeof p === 'string' ? p : p?.nombre ?? p,
    documento: typeof p === 'object' ? (p?.documento ?? '') : '',
  })),
});

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

export const createSubproyecto = (data) => {
  const payload = buildSubproyectoPayload(data);
  return httpClient.post('/subproyectos', payload);
};

export const updateSubproyecto = (id, data) => {
  const payload = buildSubproyectoPayload(data);
  return httpClient.put(`/subproyectos/${id}`, payload);
};

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

// ─── Cuadrillas (con transformación) ─────────────────────────────────
export const updateCuadrillas = (subproyectoId, data) => {
  const payload = buildCuadrillaPayload(data);
  return httpClient.put(`/subproyectos/${subproyectoId}`, payload);
};