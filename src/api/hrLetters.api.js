import apiClient from './client';

export const HR_LETTER_TYPES = [
  { value: 'employment_confirmation', label: 'Employment Confirmation Letter' },
  { value: 'salary_certificate', label: 'Salary Certificate' },
  { value: 'experience_letter', label: 'Experience Certificate' },
  { value: 'reference_letter', label: 'Reference Letter' },
  { value: 'noc', label: 'No Objection Certificate (NOC)' },
  { value: 'other', label: 'Other' },
];

export const hrLettersApi = {
  getMyRequests: async (params = {}) => {
    return apiClient.get('/hr-letters/my', { params });
  },

  getAllRequests: async (params = {}) => {
    return apiClient.get('/hr-letters', { params });
  },

  getRequestById: async (id) => {
    return apiClient.get(`/hr-letters/${id}`);
  },

  createRequest: async (dto) => {
    return apiClient.post('/hr-letters', dto);
  },

  cancelRequest: async (id) => {
    return apiClient.put(`/hr-letters/${id}/cancel`);
  },

  generateLetter: async (id) => {
    return apiClient.put(`/hr-letters/${id}/process`);
  },

  rejectRequest: async (id, rejectionReason) => {
    return apiClient.put(`/hr-letters/${id}/reject`, { rejectionReason });
  },

  downloadPdf: async (id) => {
    return apiClient.get(`/hr-letters/${id}/pdf`, { responseType: 'blob' });
  },
};

export default hrLettersApi;
