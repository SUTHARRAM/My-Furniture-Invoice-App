import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly refresh cookie
});

// Inject access token from memory store
api.interceptors.request.use((config) => {
  const token = (window as any).__accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, try refresh then retry — but never for the refresh endpoint itself
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isRefreshCall = original?.url?.includes('/auth/refresh');
    if (error.response?.status === 401 && !original._retry && !isRefreshCall) {
      original._retry = true;
      try {
        const resp = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = resp.data.data.access_token;
        (window as any).__accessToken = newToken;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        (window as any).__accessToken = null;
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
