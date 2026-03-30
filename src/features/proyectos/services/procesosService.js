import httpClient from "../../../core/api/httpClient";

export const getProcesos = () =>
  httpClient.get("/procesos");

export const createProceso = (data) =>
  httpClient.post("/procesos", data);

export const updateProceso = (id, data) =>
  httpClient.put(`/procesos/${id}`, data);

export const deleteProceso = (id) =>
  httpClient.delete(`/procesos/${id}`);