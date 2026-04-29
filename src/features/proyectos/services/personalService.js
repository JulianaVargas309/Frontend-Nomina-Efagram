import httpEfaStack from "../../../core/api/httpEfastack";

export const getPersonas = () =>
  httpEfaStack.get('/personas');

// alias para compatibilidad con otros componentes
export const getPersonal = () =>
  httpEfaStack.get('/users');

export const createPersona = (data) =>
  httpClient.post('/personas', data);

export const updatePersona = (id, data) =>
  httpClient.put(`/personas/${id}`, data);

export const deletePersona = (id) =>
  httpClient.post(`/personas/${id}/retirar`, { motivo: 'Retiro desde catálogo' });

export const getPersonasBulkTemplateData = () =>
  httpClient.get('/personas/bulk/template-data');

export const bulkUpsertPersonas = (rows) =>
  httpClient.post('/personas/bulk/upsert', { rows });