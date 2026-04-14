import api from './axiosInstance';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth.types';

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<{ data: { user_id: string } }>('/auth/register', data),

  login: (data: LoginPayload) =>
    api.post<{ data: AuthResponse }>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post<{ data: { access_token: string } }>('/auth/refresh'),

  me: () => api.get<{ data: User }>('/auth/me'),
};
