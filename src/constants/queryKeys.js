/**
 * Centralized Query Keys factory for TanStack React Query.
 * Using a unified factory prevents stale cache issues and key mismatches.
 */
export const queryKeys = {
  tasks: {
    all: ['tasks'],
    onboarding: () => ['onboarding-tasks'],
    onboardingEmployee: (employeeId) => ['onboarding-tasks', employeeId],
    myOnboarding: (employeeId) => ['my-onboarding-tasks', employeeId],
    employeeTasks: (employeeId) => ['employee-tasks', employeeId],
    projects: () => ['project-tasks'],
    taskManagerEmployees: () => ['task-manager-employees'],
    /**
     * Invalidate every task-related query across Admin, ESS, and Employee portals.
     */
    invalidateAll: (queryClient, employeeId = null) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-onboarding-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['employee-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-manager-employees'] });
      if (employeeId) {
        queryClient.invalidateQueries({ queryKey: ['onboarding-tasks', employeeId] });
        queryClient.invalidateQueries({ queryKey: ['employee-tasks', employeeId] });
        queryClient.invalidateQueries({ queryKey: ['my-onboarding-tasks', employeeId] });
        queryClient.invalidateQueries({ queryKey: ['tasks', employeeId] });
      }
    },
  },
  templates: {
    all: ['templates'],
    detail: (id) => ['templates', id],
  },
  companyLibrary: {
    all: ['company-library'],
    folders: (search = '') => ['company-library', 'folders', search],
    folder: (id) => ['company-library', 'folder', id],
    assets: (params = {}) => ['company-library', 'assets', params],
    invalidateAll: (queryClient) => {
      queryClient.invalidateQueries({ queryKey: ['company-library'] });
    },
  },
  employees: {
    all: ['employees'],
    paginated: () => ['paginatedEmployees'],
    detail: (id) => ['employee', id],
  },
};
