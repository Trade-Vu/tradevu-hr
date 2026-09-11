import apiClient from './client';

export const onboardingApi = {
  getAllTasks: async () => {
    return apiClient.get('/onboarding/tasks');
  },

  getMyTasks: async () => {
    return apiClient.get('/onboarding/tasks/my');
  },

  getEmployeeTasks: async (employeeId) => {
    return apiClient.get(`/onboarding/tasks/employee/${employeeId}`);
  },

  updateTask: async (id, dto) => {
    return apiClient.put(`/onboarding/tasks/${id}`, dto);
  },

  getTemplates: async () => {
    return apiClient.get('/onboarding/templates');
  },

  assignTemplate: async (employeeId, templateId) => {
    return apiClient.post('/onboarding/assign', { employeeId, templateId });
  },

  getProgress: async (params) => {
    return apiClient.get('/onboarding/progress', { params });
  },
};

export default onboardingApi;
