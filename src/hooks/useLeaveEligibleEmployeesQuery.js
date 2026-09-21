import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '@/api';

// Employees leave can be filed for: onboarded and still employed (backend filter leaveEligible=true,
// see isLeaveEligibleStatus in @/lib/employmentStatus). Own query key: the bare ['employees'] key is
// shared by pages that fetch unfiltered lists in a different shape.
export function useLeaveEligibleEmployees(options = {}) {
  return useQuery({
    queryKey: ['employees', 'leave-eligible'],
    queryFn: async () => {
      const list = await employeesApi.getAllEmployees({ leaveEligible: true });
      return list.map(e => ({ ...e, id: e._id || e.id, full_name: e.fullName || e.full_name }));
    },
    initialData: [],
    ...options,
  });
}
