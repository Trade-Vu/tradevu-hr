import apiClient from './client';

export const attendanceApi = {
  clockIn: async (dto = {}) => {
    return apiClient.post('/attendance/clock-in', dto);
  },

  clockOut: async () => {
    return apiClient.post('/attendance/clock-out');
  },

  getTodayStatus: async () => {
    return apiClient.get('/attendance/today');
  },

  getMyAttendance: async (params = {}) => {
    return apiClient.get('/attendance/my', { params });
  },

  getAllAttendance: async (params = {}) => {
    return apiClient.get('/attendance', { params });
  },

  createManual: async (dto) => {
    return apiClient.post('/attendance/manual', dto);
  },

  getMonthlyReport: async (year, month) => {
    return apiClient.get('/attendance/report/monthly', { params: { year, month } });
  },
};

export default attendanceApi;
