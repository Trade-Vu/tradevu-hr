import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { approvalsApi } from '@/api';
import { isAdmin as checkIsAdmin, isSuperAdmin as checkIsSuperAdmin, isManager as checkIsManager } from '@/lib/roleUtils';
import { extractErrorMessage, getRefId } from '@/lib/utils';
import { isPendingLeaveStatus } from '@/lib/leaveStatus';

export function usePendingApprovalsData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: async () => await approvalsApi.getPendingApprovals(),
    enabled: !!user
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    queryClient.refetchQueries({ queryKey: ['pendingApprovals'] });
    queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
    queryClient.refetchQueries({ queryKey: ['pendingApprovalsCount'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] });
  };

  const handleError = (err) => {
    toast.error(extractErrorMessage(err, "Operation failed."));
  };

  const { mutate: approveEmployee, isPending: isApprovingEmployee, variables: empAppVars } = useMutation({
    mutationFn: (variables) => approvalsApi.approveEmployee(variables.employeeId || variables.id),
    onSuccess: () => {
      toast.success("Employee approved successfully!");
      invalidate();
    },
    onError: handleError
  });

  const { mutate: approveCompletedTasks, isPending: isApprovingTasks } = useMutation({
    mutationFn: (variables) => approvalsApi.approveCompletedTasks(variables.employeeId, variables.taskIds),
    onSuccess: async () => {
      toast.success("Tasks approved successfully!");
      invalidate();
      await queryClient.refetchQueries({ queryKey: ['pendingApprovalsCount'] });
      await queryClient.refetchQueries({ queryKey: ['pendingApprovals'] });
    },
    onError: handleError
  });

  const { mutate: approveProbationSetup, isPending: isApprovingProbationSetup } = useMutation({
    mutationFn: (variables) => approvalsApi.approveProbationSetup(variables.employeeId, variables.startDate, variables.endDate),
    onSuccess: () => {
      toast.success("Probation period set successfully!");
      invalidate();
    },
    onError: handleError
  });

  const { mutate: approveProbationEnd, isPending: isApprovingProbationEnd } = useMutation({
    mutationFn: (variables) => approvalsApi.approveProbationEnd(variables.employeeId),
    onSuccess: () => {
      toast.success("Employee successfully moved to active status!");
      invalidate();
    },
    onError: handleError
  });

  const { mutate: offboardEmployee, isPending: isOffboarding } = useMutation({
    mutationFn: (id) => approvalsApi.requestOffboarding(id, { exitType: 'termination', exitDate: new Date().toISOString() }),
    onSuccess: () => {
      toast.success("Employee offboarding initiated!");
      invalidate();
    },
    onError: handleError
  });

  const { mutate: approveDocument, isPending: isApprovingDoc, variables: docAppVars } = useMutation({
    mutationFn: (variables) => approvalsApi.approveDocument(variables.id, variables.notes),
    onSuccess: () => {
      toast.success("Document approved!");
      invalidate();
    },
    onError: handleError
  });

  const { mutate: rejectDocument, isPending: isRejectingDoc, variables: docRejVars } = useMutation({
    mutationFn: (variables) => approvalsApi.rejectDocument(variables.id, variables.reason),
    onSuccess: () => {
      toast.success("Document rejected!");
      invalidate();
    },
    onError: handleError
  });

  const { mutate: approveLeave, isPending: isApprovingLeave, variables: leaveAppVars } = useMutation({
    mutationFn: (variables) => approvalsApi.approveLeave(variables.id),
    onSuccess: () => {
      toast.success("Leave approved!");
      invalidate();
    },
    onError: handleError
  });

  const { mutate: rejectLeave, isPending: isRejectingLeave, variables: leaveRejVars } = useMutation({
    mutationFn: (variables) => approvalsApi.rejectLeave(variables.id, variables.reason),
    onSuccess: () => {
      toast.success("Leave rejected!");
      invalidate();
    },
    onError: handleError
  });

  const { mutate: approveProfile, isPending: isApprovingProfile, variables: profAppVars } = useMutation({
    mutationFn: (variables) => approvalsApi.approveProfileUpdate(variables.id),
    onSuccess: () => {
      toast.success("Profile update approved!");
      invalidate();
    },
    onError: handleError
  });

  const { mutate: rejectProfile, isPending: isRejectingProfile, variables: profRejVars } = useMutation({
    mutationFn: (variables) => approvalsApi.rejectProfileUpdate(variables.id, variables.reason),
    onSuccess: () => {
      toast.success("Profile update rejected!");
      invalidate();
    },
    onError: handleError
  });

  const { mutate: approveOffboarding } = useMutation({
    mutationFn: (variables) => approvalsApi.approveOffboarding(variables.id, variables.comments),
    onSuccess: () => { toast.success("Offboarding approved!"); invalidate(); },
    onError: handleError
  });

  const { mutate: rejectOffboarding } = useMutation({
    mutationFn: (variables) => approvalsApi.rejectOffboarding(variables.id, variables.comments),
    onSuccess: () => { toast.success("Offboarding rejected!"); invalidate(); },
    onError: handleError
  });

  const { mutate: approveProbation } = useMutation({
    mutationFn: (variables) => approvalsApi.approveProbationSetup(variables.id, variables.startDate, variables.endDate),
    onSuccess: () => { toast.success("Probation request updated!"); invalidate(); },
    onError: handleError
  });

  const { mutate: requestOffboarding, isPending: isRequestingOffboarding } = useMutation({
    mutationFn: ({ id, data: offData }) => approvalsApi.requestOffboarding(id, offData),
    onSuccess: () => {
      toast.success("Offboarding request submitted for approval.");
      invalidate();
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "Failed to submit offboarding request."));
    }
  });

  const approveDepartmentMutation = useMutation({
    mutationFn: async (id) => await approvalsApi.approveDepartment(id),
    onSuccess: () => {
      toast.success("Department approved successfully.");
      invalidate();
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "Failed to approve department."));
    }
  });

  // Filter out the logged in user so they don't approve their own profile/tasks
  const currentUserId = getRefId(user?.employeeId);
  const allEmployees = (data?.employees || []).filter(e => {
    const empId = e.id || e._id;
    return empId !== currentUserId;
  });

  const pendingProfileReviews = allEmployees.filter(e => 
    e.employmentStatus === 'PENDING_APPROVAL' && 
    (!e.onboardingStatus || ['NOT_STARTED', 'not_started', 'SUBMITTED', 'submitted', 'PENDING', 'pending'].includes(e.onboardingStatus))
  );

  const pendingTasksReviews = allEmployees.filter(e => {
    // Show any employee who has completed onboarding tasks awaiting HR review/approval
    return e.onboardingTasks?.some(t => 
      (t.isCompleted || ['completed', 'done', 'DONE', 'COMPLETED'].includes(t.status)) && t.status !== 'approved'
    );
  });

  const pendingProbationSetups = allEmployees.filter(e => {
    if (e.employmentStatus === 'PENDING_APPROVAL' && ['PROBATION_PENDING', 'probation_pending'].includes(e.onboardingStatus)) return true;
    
    if (['ONGOING_ONBOARDING', 'PENDING_ONBOARDING'].includes(e.employmentStatus)) {
      if (e.onboardingTasks && e.onboardingTasks.length > 0) {
        return e.onboardingTasks.every(t => t.status === 'approved');
      }
    }
    return false;
  });

  const pendingProbationEnds = allEmployees.filter(e =>
    e.employmentStatus === 'PROBATION' && e.probationEndDate && new Date(e.probationEndDate) <= new Date()
  );

  const pendingDocuments = data?.documents?.filter(d => {
    const docEmpId = d.employeeId?._id || d.employeeId?.id || d.employeeId;
    if (docEmpId && docEmpId === currentUserId) return false;
    return d.status?.toUpperCase() === 'PENDING';
  }) || [];

  const isAdmin = checkIsAdmin(user);
  const isSuperAdmin = checkIsSuperAdmin(user);

  const pendingLeaves = data?.leaveRequests?.filter(l => {
    const leaveEmpId = l.employeeId?._id || l.employeeId?.id || l.employeeId;
    if (l.employee?.email === user?.email || leaveEmpId === currentUserId) return false;
    return isPendingLeaveStatus(l.status);
  }) || [];

  const pendingProfiles = data?.profileUpdateRequests?.filter(p => {
    return p.status?.toUpperCase() === 'PENDING';
  }) || [];

  const pendingOffboardings = data?.allOffboardings?.filter(o => o.status?.toUpperCase() === 'PENDING') || [];
  const pendingProbations = data?.allProbationRequests?.filter(p => p.status?.toUpperCase() === 'PENDING') || [];
  const pendingDepartments = data?.departments?.filter(d => d.status?.toUpperCase() === 'PENDING') || [];

  // Group by Employee for Unified View
  const unifiedEmployeeIds = Array.from(new Set([
    ...pendingProfileReviews.map(e => e.id || e._id),
    ...pendingDocuments.map(d => d.employeeId?._id || d.employeeId?.id || d.employeeId),
    ...pendingProfiles.map(p => p.employeeId?._id || p.employeeId?.id || p.employeeId)
  ].filter(Boolean)));

  const totalEmployeeReviewsCount = 
    unifiedEmployeeIds.length + 
    pendingTasksReviews.length + 
    pendingProbationSetups.length + 
    pendingProbationEnds.length + 
    pendingProbations.length + 
    pendingOffboardings.length;

  const getEmployeeName = (empId) => {
    const emp = data?.employees?.find(e => (e.id || e._id) === empId);
    return emp?.fullName || emp?.full_name || 'Unknown Employee';
  };

  const getEmployeeDept = (empId) => {
    const emp = data?.employees?.find(e => (e.id || e._id) === empId);
    return emp?.department?.name || emp?.departmentId?.name || (typeof emp?.departmentId === 'string' ? emp.departmentId : 'No Dept');
  };

  const getEmployeeJobTitle = (empId) => {
    const emp = data?.employees?.find(e => (e.id || e._id) === empId);
    return emp?.jobTitle || emp?.job_title || 'No Title';
  };

  return {
    user,
    data,
    loading,
    error,
    isAdmin,
    isSuperAdmin,
    isManager: checkIsManager(user),
    currentUserId,
    allEmployees,
    pendingProfileReviews,
    pendingTasksReviews,
    pendingProbationSetups,
    pendingProbationEnds,
    pendingDocuments,
    pendingLeaves,
    pendingProfiles,
    pendingOffboardings,
    pendingProbations,
    pendingDepartments,
    unifiedEmployeeIds,
    totalEmployeeReviewsCount,
    getEmployeeName,
    getEmployeeDept,
    getEmployeeJobTitle,
    // Mutations
    approveEmployee,
    isApprovingEmployee,
    empAppVars,
    approveCompletedTasks,
    isApprovingTasks,
    approveProbationSetup,
    isApprovingProbationSetup,
    approveProbationEnd,
    isApprovingProbationEnd,
    offboardEmployee,
    isOffboarding,
    approveDocument,
    isApprovingDoc,
    docAppVars,
    rejectDocument,
    isRejectingDoc,
    docRejVars,
    approveLeave,
    isApprovingLeave,
    leaveAppVars,
    rejectLeave,
    isRejectingLeave,
    leaveRejVars,
    approveProfile,
    isApprovingProfile,
    profAppVars,
    rejectProfile,
    isRejectingProfile,
    profRejVars,
    approveOffboarding,
    rejectOffboarding,
    approveProbation,
    requestOffboarding,
    isRequestingOffboarding,
    approveDepartmentMutation,
    invalidate
  };
}
