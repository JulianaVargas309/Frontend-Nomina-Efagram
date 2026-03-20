import httpClient from '../../../core/api/httpClient';

export const getPersonas = () =>
  httpClient.get('/personas');

// alias para compatibilidad con otros componentes
export const getPersonal = () =>
  httpClient.get('/personas');

export const createPersona = (data) =>
  httpClient.post('/personas', data);

export const updatePersona = (id, data) =>
  httpClient.put(`/personas/${id}`, data);

export const deletePersona = (id) =>
  httpClient.post(`/personas/${id}/retirar`, { motivo: 'Retiro desde catálogo' });