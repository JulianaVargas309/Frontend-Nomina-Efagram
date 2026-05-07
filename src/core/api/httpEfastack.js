import axios from 'axios';

const httpEfaStack = axios.create({
  baseURL: import.meta.env.VITE_EFASTACK_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default httpEfaStack;