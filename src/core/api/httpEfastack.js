import axios from 'axios';
import { getToken } from '../auth/tokenStorage';

const httpEfaStack = axios.create({
  baseURL: import.meta.env.VITE_EFASTACK_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

httpEfaStack.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default httpEfaStack;