import httpClient from '../../../core/api/httpClient';
import { endpoints } from '../../../core/api/endpoints';


export const getUsuarios = async () => {
  const response = await httpClient.get(endpoints.usuarios.getAll);
  // La API devuelve { success, data: { users: [...] } }
  return response.data?.data?.users || [];
};

export const createUsuario = async (payload) => {
  const response = await httpClient.post(endpoints.usuarios.create, payload);
  return response.data;
};

export const updateUsuario = async (id, payload) => {
  const response = await httpClient.put(endpoints.usuarios.update(id), payload);
  return response.data;
};

export const deleteUsuario = async (id) => {
  const response = await httpClient.delete(endpoints.usuarios.delete(id));
  return response.data;
};
