import apiClient from './client';

export const compensationApi = {
  getStructures: async (params = {}) => {
    return apiClient.get('/compensation/structures', { params });
  },

  getStructureById: async (id) => {
    return apiClient.get(`/compensation/structures/${id}`);
  },

  createStructure: async (data) => {
    return apiClient.post('/compensation/structures', data);
  },

  updateStructure: async (id, data) => {
    return apiClient.put(`/compensation/structures/${id}`, data);
  },

  assign: async (data) => {
    return apiClient.post('/compensation/assignments', data);
  },

  getAssignments: async (params = {}) => {
    return apiClient.get('/compensation/assignments', { params });
  },
};

export default compensationApi;
