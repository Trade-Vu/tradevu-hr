import apiClient from './client';

export const approvalsApi = {
  getPendingCounts: async () => {
    return apiClient.get('/approvals/pending-counts');
  },

  getPendingCountsStreamToken: async () => {
    return apiClient.post('/approvals/pending-counts/stream-token');
  },

  getPendingApprovals: async () => {
    return apiClient.get('/approvals/pending');
  },

  // Employee Approvals
  approveEmployee: async (employeeId) => {
    return apiClient.put(`/approvals/employees/${employeeId}/approve`);
  },

  rejectEmployee: async (employeeId, reason) => {
    return apiClient.put(`/approvals/employees/${employeeId}/reject`, { reason });
  },

  approveCompletedTasks: async (employeeId, taskIds) => {
    return apiClient.put(`/approvals/employees/${employeeId}/approve-tasks`, { taskIds });
  },

  approveProbationSetup: async (employeeId, startDate, endDate) => {
    return apiClient.put(`/approvals/employees/${employeeId}/probation-setup`, { startDate, endDate });
  },

  approveProbationEnd: async (employeeId) => {
    return apiClient.put(`/approvals/employees/${employeeId}/probation-end`);
  },

  // Document Approvals
  approveDocument: async (documentId, notes) => {
    return apiClient.put(`/approvals/documents/${documentId}/approve`, { notes });
  },

  rejectDocument: async (documentId, reason) => {
    return apiClient.put(`/approvals/documents/${documentId}/reject`, { reason });
  },

  // Leave Approvals
  approveLeave: async (leaveId) => {
    return apiClient.put(`/approvals/leave/${leaveId}/approve`);
  },

  rejectLeave: async (leaveId, reason) => {
    return apiClient.put(`/approvals/leave/${leaveId}/reject`, { reason });
  },

  requestLeaveInformation: async (leaveId, message) => {
    return apiClient.put(`/approvals/leave/${leaveId}/request-information`, { message });
  },

  // Offboarding Approvals
  approveOffboarding: async (offboardingId, comments) => {
    return apiClient.put(`/approvals/offboarding/${offboardingId}/approve`, { comments });
  },

  rejectOffboarding: async (offboardingId, comments) => {
    return apiClient.put(`/approvals/offboarding/${offboardingId}/reject`, { comments });
  },

  requestOffboarding: async (employeeId, data) => {
    return apiClient.post('/approvals/offboarding/request', { employeeId, ...data });
  },

  // Department Approvals
  approveDepartment: async (departmentId) => {
    return apiClient.put(`/approvals/departments/${departmentId}/approve`);
  },

  // Workflow & Profile Updates
  getWorkflows: async () => {
    return apiClient.get('/approvals/workflows');
  },

  createWorkflow: async (data) => {
    return apiClient.post('/approvals/workflows', data);
  },

  updateWorkflow: async (id, data) => {
    return apiClient.put(`/approvals/workflows/${id}`, data);
  },

  deleteWorkflow: async (id) => {
    return apiClient.delete(`/approvals/workflows/${id}`);
  },

  getProfileUpdateRequests: async (params) => {
    return apiClient.get('/approvals/profile-updates', { params });
  },

  requestProfileUpdate: async (data) => {
    return apiClient.post('/approvals/profile-updates', data);
  },

  approveProfileUpdate: async (id) => {
    return apiClient.put(`/approvals/profile-updates/${id}/approve`);
  },

  rejectProfileUpdate: async (id, rejectionReason) => {
    return apiClient.put(`/approvals/profile-updates/${id}/reject`, { rejectionReason });
  },
};

export default approvalsApi;
