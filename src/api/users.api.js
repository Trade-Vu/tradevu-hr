import apiClient from './client';

export const usersApi = {
  getUsers: async (params = {}) => {
    return apiClient.get('/users', { params });
  },

  updateMe: async (dto) => {
    return apiClient.patch('/users/me', dto);
  },

  updateViewMode: async (viewMode) => {
    return apiClient.patch('/users/me/view-mode', { viewMode });
  },

  clearProfileGate: async () => {
    return apiClient.post('/users/clear-profile-gate');
  },
};

export default usersApi;
