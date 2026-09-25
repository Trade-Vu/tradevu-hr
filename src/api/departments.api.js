import apiClient from './client';

export const departmentsApi = {
  getDepartments: async () => {
    return apiClient.get('/departments');
  },

  getDepartmentById: async (id) => {
    return apiClient.get(`/departments/${id}`);
  },

  createDepartment: async (dto) => {
    return apiClient.post('/departments', dto);
  },

  updateDepartment: async (id, dto) => {
    return apiClient.patch(`/departments/${id}`, dto);
  },

  deleteDepartment: async (id) => {
    return apiClient.delete(`/departments/${id}`);
  },
};

export default departmentsApi;
