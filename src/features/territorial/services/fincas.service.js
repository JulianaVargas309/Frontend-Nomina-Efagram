import httpEfaStack from "../../../core/api/httpEfastack";

export const getFincas = async () => {
  const response = await httpEfaStack.get('/fincas');
  return response.data;
};

export const getNextFincaCode = async (nucleoId) => {
  const response = await httpEfaStack.get('/fincas/next-code', {
    params: { nucleo: nucleoId }
  });
  return response.data;
};

export const createFinca = async (data) => {
  const response = await httpEfaStack.post('/fincas', data);
  return response.data;
};

export const updateFinca = async (id, data) => {
  const response = await httpEfaStack.put(`/fincas/${id}`, data);
  return response.data;
};

export const deleteFinca = async (id) => {
  const response = await httpEfaStack.delete(`/fincas/${id}`);
  return response.data;
};

export const getFincasBulkTemplateData = async () => {
  const response = await httpEfaStack.get('/fincas/bulk/template-data');
  return response.data;
};

export const bulkUpsertFincas = async (rows) => {
  const response = await httpEfaStack.post('/fincas/bulk/upsert', { rows });
  return response.data;
};