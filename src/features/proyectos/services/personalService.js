import httpEfaStack from '../../../core/api/httpEfastack';
import httpClient from '../../../core/api/httpClient';

export const getPersonas = async () => {
  const response = await httpEfaStack.get('/personas');
  return response.data;
};

export const getPersonal = async () => {
  const response = await httpEfaStack.get('/users');
  return response.data;
};

export const createPersona = (data) =>
  httpClient.post('/personas', data);

export const updatePersona = (id, data) =>
  httpClient.put(`/personas/${id}`, data);

export const deletePersona = (id) =>
  httpClient.post(`/personas/${id}/retirar`, {
    motivo: 'Retiro desde catálogo'
  });

export const getPersonasBulkTemplateData = () =>
  httpClient.get('/personas/bulk/template-data');

export const bulkUpsertPersonas = (rows) =>
  httpClient.post('/personas/bulk/upsert', { rows });