import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://ai-document-summarizer-backend-9yha.onrender.com/api/v1',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        // If unauthorized, clear token and maybe redirect
        localStorage.removeItem('token');
        // We handle redirect in AuthContext or components, but we could do window.location.href = '/login' here if strictly necessary
    }
    return Promise.reject(error);
});

export default api;
