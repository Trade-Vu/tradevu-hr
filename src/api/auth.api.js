import apiClient from './client';

export const authApi = {
  login: async (credentials) => {
    return apiClient.post('/auth/login', credentials);
  },

  register: async (data) => {
    return apiClient.post('/auth/register', data);
  },

  getMe: async () => {
    return apiClient.get('/auth/me');
  },

  forgotPassword: async (email) => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async ({ token, password }) => {
    return apiClient.post('/auth/reset-password', { token, password });
  },

  acceptInvite: async ({ token, fullName, password }) => {
    return apiClient.post('/auth/accept-invite', { token, fullName, password });
  },
};

export default authApi;
