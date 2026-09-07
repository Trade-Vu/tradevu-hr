import apiClient from './client';

export const projectsApi = {
  getProjects: async (params) => {
    return apiClient.get('/projects', { params });
  },

  getProjectById: async (id) => {
    return apiClient.get(`/projects/${id}`);
  },

  createProject: async (dto) => {
    return apiClient.post('/projects', dto);
  },

  updateProject: async (id, dto) => {
    return apiClient.put(`/projects/${id}`, dto);
  },

  deleteProject: async (id) => {
    return apiClient.delete(`/projects/${id}`);
  },

  getAllTasks: async (params) => {
    return apiClient.get('/projects/tasks/all', { params });
  },

  getProjectTasks: async (projectId) => {
    return apiClient.get(`/projects/${projectId}/tasks`);
  },

  createTask: async (dto) => {
    return apiClient.post('/projects/tasks', dto);
  },

  addTask: async (projectId, dto) => {
    return apiClient.post(`/projects/${projectId}/tasks`, dto);
  },

  updateTask: async (taskId, dto) => {
    return apiClient.put(`/projects/tasks/${taskId}`, dto);
  },

  deleteTask: async (taskId) => {
    return apiClient.delete(`/projects/tasks/${taskId}`);
  },
};

export default projectsApi;
