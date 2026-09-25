import apiClient from './client';

export const assetsApi = {
  getAssets: async (params = {}) => {
    return apiClient.get('/assets', { params });
  },

  getMyAssets: async (employeeId) => {
    return apiClient.get('/assets', { params: { assignedTo: employeeId } });
  },

  getAssetById: async (id) => {
    return apiClient.get(`/assets/${id}`);
  },
};

export default assetsApi;
