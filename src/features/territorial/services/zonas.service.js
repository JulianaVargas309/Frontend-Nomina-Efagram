import httpEfaStack from '../../../core/api/httpEfastack';

export const getZonas = async () => {
  const response = await httpEfaStack.get('/zonas');
  return response.data;
};

export const getNextZonaCode = async () => {
  const response = await httpEfaStack.get('/zonas/next-code');
  return response.data;
};

export const createZona = async (data) => {
  const response = await httpEfaStack.post('/zonas', data);
  return response.data;
};

export const updateZona = async (id, data) => {
  const response = await httpEfaStack.put(`/zonas/${id}`, data);
  return response.data;
};

export const deleteZona = async (id) => {
  const response = await httpEfaStack.delete(`/zonas/${id}`);
  return response.data;
};