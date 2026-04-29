import httpEfaStack from '../../../core/api/httpEfastack';

export const getNucleos = async () => {
  const response = await httpEfaStack.get('/nucleos');
  return response.data;
};

export const getNextNucleoCode = async (zonaId) => {
  const response = await httpEfaStack.get('/nucleos/next-code', {
    params: { zona: zonaId }
  });
  return response.data;
};

export const createNucleo = async (data) => {
  const response = await httpEfaStack.post('/nucleos', data);
  return response.data;
};

export const updateNucleo = async (id, data) => {
  const response = await httpEfaStack.put(`/nucleos/${id}`, data);
  return response.data;
};

export const deleteNucleo = async (id) => {
  const response = await httpEfaStack.delete(`/nucleos/${id}`);
  return response.data;
};