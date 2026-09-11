import apiClient from './client';

export const organizationsApi = {
  getMyOrganization: async () => {
    return apiClient.get('/organizations/me');
  },

  updateMyOrganization: async (dto) => {
    return apiClient.patch('/organizations/me', dto);
  },
};

export default organizationsApi;
