import axios from 'axios';

const httpEfaStack = axios.create({
    baseURL: import.meta.env.VITE_EFASTACK_API_URL,
});

export default httpEfaStack;
