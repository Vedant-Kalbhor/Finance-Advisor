import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  register: async (email, password, fullName) => {
    const response = await api.post('/auth/register', { email, password, full_name: fullName });
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  }
};

export default api;
