import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '@/api';

export const EMPLOYEE_KEYS = {
  all: ['employees'],
  lists: () => [...EMPLOYEE_KEYS.all, 'list'],
  list: (filters) => [...EMPLOYEE_KEYS.lists(), filters],
  details: () => [...EMPLOYEE_KEYS.all, 'detail'],
  detail: (id) => [...EMPLOYEE_KEYS.details(), id],
  stats: () => [...EMPLOYEE_KEYS.all, 'stats'],
};

export function useEmployees(params = {}) {
  return useQuery({
    queryKey: EMPLOYEE_KEYS.list(params),
    queryFn: () => employeesApi.getEmployees(params),
  });
}

export function useEmployeeStats() {
  return useQuery({
    queryKey: EMPLOYEE_KEYS.stats(),
    queryFn: () => employeesApi.getStats(),
  });
}

export function useEmployee(id) {
  return useQuery({
    queryKey: EMPLOYEE_KEYS.detail(id),
    queryFn: () => employeesApi.getEmployeeById(id),
    enabled: Boolean(id),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto) => employeesApi.createEmployee(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.all });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }) => employeesApi.updateEmployee(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => employeesApi.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.all });
    },
  });
}
