import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { gql } from 'graphql-request';
import { gqlClient } from '@/api/graphqlClient';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CheckCircle2, XCircle, FileText, UserCircle, CalendarRange, Eye, Inbox, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { extractErrorMessage } from '../lib/utils';
import { motion } from 'framer-motion';
import EmployeeDetail from './EmployeeDetail';
import UnifiedProfileReviewDialog from '../components/UnifiedProfileReviewDialog';

const GET_PENDING_APPROVALS = gql`
  query GetPendingApprovals {
    employees {
      id
      fullName
      jobTitle
      employmentStatus
      onboardingStatus
      probationEndDate
      hireDate
      onboardingTasks {
        id
        title
        status
        category
        isCompleted
      }
      department {
        name
      }
    }

    documents {
      id
      name
      category
      status
      employeeId
      fileUrl
      fileType
      createdAt
    }
    leaveRequests {
      id
      employeeId
      leaveTypeId
      startDate
      endDate
      totalDays
      status
      reason
      attachmentUrl
      createdAt
      employee {
        email
      }
    }
    profileUpdateRequests {
      id
      employeeId
      fieldName
      currentValue
      requestedValue
      status
      createdAt
    }
    allOffboardings {
      id
      employeeId
      exitType
      exitDate
      reason
      status
      employee {
        fullName
      }
    }
    allProbationRequests {
      id
      employeeId
      startDate
      endDate
      status
      employee {
        fullName
      }
    }
  }
`;

const GET_PENDING_DEPARTMENTS = gql`
  query GetPendingDepartments {
    departments {
      id
      name
      code
      status
    }
  }
`;

const APPROVE_EMPLOYEE = gql`
  mutation ApproveEmployee($employeeId: ID!) {
    approveEmployeeData(employeeId: $employeeId) {
      id
      employmentStatus
    }
  }
`;

const APPROVE_DEPARTMENT = gql`
  mutation ApproveDepartment($id: ID!) {
    approveDepartment(id: $id) {
      id
      status
    }
  }
`;

const APPROVE_COMPLETED_TASKS = gql`
  mutation ApproveCompletedTasks($employeeId: ID!, $taskIds: [ID!]!) {
    approveCompletedTasks(employeeId: $employeeId, taskIds: $taskIds) {
      id
      onboardingStatus
      employmentStatus
    }
  }
`;

const APPROVE_PROBATION_SETUP = gql`
  mutation ApproveProbationSetup($employeeId: ID!, $startDate: String!, $endDate: String!) {
    approveProbationSetup(employeeId: $employeeId, startDate: $startDate, endDate: $endDate) {
      id
      employmentStatus
      onboardingStatus
      probationStartDate
      probationEndDate
    }
  }
`;

const APPROVE_PROBATION_END = gql`
  mutation ApproveProbationEnd($employeeId: ID!) {
    approveProbationEnd(employeeId: $employeeId) {
      id
      employmentStatus
    }
  }
`;

const REQUEST_OFFBOARDING = gql`
  mutation RequestOffboarding($id: ID!, $input: OffboardEmployeeInput!) {
    requestOffboarding(id: $id, input: $input) {
      id
      status
    }
  }
`;

const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployee($id: ID!, $input: UpdateEmployeeInput!, $auditAction: String, $auditContext: String) {
    updateEmployee(id: $id, input: $input, auditAction: $auditAction, auditContext: $auditContext) {
      id
      employmentStatus
    }
  }
`;

const APPROVE_DOCUMENT = gql`
  mutation ApproveDocument($id: ID!) {
    approveDocument(id: $id) {
      id
      status
    }
  }
`;

const REJECT_DOCUMENT = gql`
  mutation RejectDocument($id: ID!, $reason: String, $attachmentUrl: String) {
    rejectDocument(id: $id, reason: $reason, attachmentUrl: $attachmentUrl) {
      id
      status
    }
  }
`;

const APPROVE_LEAVE = gql`
  mutation ApproveLeave($id: ID!) {
    approveLeaveRequest(id: $id) {
      id
      status
    }
  }
`;

const REJECT_LEAVE = gql`
  mutation RejectLeave($id: ID!, $reason: String, $attachmentUrl: String) {
    rejectLeaveRequest(id: $id, reason: $reason, attachmentUrl: $attachmentUrl) {
      id
      status
    }
  }
`;

const APPROVE_PROFILE = gql`
  mutation ApproveProfile($id: ID!) {
    approveProfileUpdateRequest(id: $id) {
      id
      status
    }
  }
`;

const REJECT_PROFILE = gql`
  mutation RejectProfile($id: ID!, $reason: String, $attachmentUrl: String!) {
    rejectProfileUpdateRequest(id: $id, reason: $reason, attachmentUrl: $attachmentUrl) {
      id
      status
    }
  }
`;


const APPROVE_OFFBOARDING = gql`
  mutation ApproveOffboarding($id: ID!, $comments: String) {
    approveOffboarding(id: $id, comments: $comments) {
      id
      status
    }
  }
`;

const REJECT_OFFBOARDING = gql`
  mutation RejectOffboarding($id: ID!, $comments: String) {
    rejectOffboarding(id: $id, comments: $comments) {
      id
      status
    }
  }
`;

const APPROVE_PROBATION = gql`
  mutation ApproveProbation($id: ID!, $status: String!, $comments: String) {
    approveProbation(id: $id, status: $status, comments: $comments) {
      id
      status
    }
  }
`;

const RejectDialog = ({ onReject, title = "Reject Request" }) => {
  const [reason, setReason] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const handleReject = () => {
    if (!reason.trim()) return;
    onReject(reason);
    setOpen(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-slate-600 border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors">
          <XCircle className="w-4 h-4" />
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-100 shadow-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Reason for rejection (Required)</label>
            <textarea
              className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
              placeholder="Please provide a reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
              disabled={!reason.trim()} 
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ApprovalsSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {Array(4).fill(0).map((_, i) => (
      <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-slate-100 rounded-xl bg-white shadow-sm gap-4">
        <div className="flex-1 space-y-3 w-full">
          <div className="h-4 bg-slate-100 rounded w-1/3"></div>
          <div className="h-3 bg-slate-100 rounded w-1/2"></div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-9 w-24 bg-slate-100 rounded-lg"></div>
          <div className="h-9 w-24 bg-slate-100 rounded-lg"></div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ message, icon: Icon }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center p-12 flex flex-col items-center justify-center border border-slate-100 rounded-2xl bg-white/50 border-dashed"
  >
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-300" />
    </div>
    <p className="text-slate-500 font-medium">{message}</p>
  </motion.div>
);

export default function PendingApprovals() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedUnifiedEmployeeId, setSelectedUnifiedEmployeeId] = useState(null);
  
  const [showOffboardDialog, setShowOffboardDialog] = useState(false);
  const [offboardTargetId, setOffboardTargetId] = useState(null);
  const [offboardForm, setOffboardForm] = useState({ type: 'RESIGNATION', exitDate: '', reason: '' });

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: async () => await gqlClient.request(GET_PENDING_APPROVALS),
    enabled: !!user
  });

  const { data: deptData, isLoading: deptLoading } = useQuery({
    queryKey: ['pendingDepartments'],
    queryFn: async () => await gqlClient.request(GET_PENDING_DEPARTMENTS),
    enabled: !!user && (user.role === 'SUPER_ADMIN' || user.is_organization_owner)
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleError = (err) => {
    toast.error(extractErrorMessage(err, "Operation failed."));
  };

  const { mutate: approveEmployee, isPending: isApprovingEmployee, variables: empAppVars } = useMutation({
    mutationFn: (variables) => gqlClient.request(APPROVE_EMPLOYEE, variables),
    onSuccess: () => {
      toast.success("Employee approved successfully!");
      invalidate();
    },
    onError: handleError
  });
  
  const { mutate: approveCompletedTasks, isPending: isApprovingTasks } = useMutation({
    mutationFn: (variables) => gqlClient.request(APPROVE_COMPLETED_TASKS, variables),
    onSuccess: () => {
      toast.success("Tasks approved successfully!");
      invalidate();
    },
    onError: handleError
  });
  
  const { mutate: approveProbationSetup, isPending: isApprovingProbationSetup } = useMutation({
    mutationFn: (variables) => gqlClient.request(APPROVE_PROBATION_SETUP, variables),
    onSuccess: () => {
      toast.success("Probation period set successfully!");
      invalidate();
    },
    onError: handleError
  });
  
  const { mutate: approveProbationEnd, isPending: isApprovingProbationEnd } = useMutation({
    mutationFn: (variables) => gqlClient.request(APPROVE_PROBATION_END, variables),
    onSuccess: () => {
      toast.success("Employee successfully moved to active status!");
      invalidate();
    },
    onError: handleError
  });

  const { mutate: offboardEmployee, isPending: isOffboarding } = useMutation({
    mutationFn: (id) => gqlClient.request(UPDATE_EMPLOYEE, { id, input: { employmentStatus: 'OFFBOARDED' } }),
    onSuccess: () => {
      toast.success("Employee offboarding initiated!");
      invalidate();
    },
    onError: handleError
  });

  
  const { mutate: approveDocument, isPending: isApprovingDoc, variables: docAppVars } = useMutation({
    mutationFn: (variables) => gqlClient.request(APPROVE_DOCUMENT, variables),
    onSuccess: () => {
      toast.success("Document approved!");
      invalidate();
    },
    onError: handleError
  });
  
  const { mutate: rejectDocument, isPending: isRejectingDoc, variables: docRejVars } = useMutation({
    mutationFn: (variables) => gqlClient.request(REJECT_DOCUMENT, variables),
    onSuccess: () => {
      toast.success("Document rejected!");
      invalidate();
    },
    onError: handleError
  });
  
  const { mutate: approveLeave, isPending: isApprovingLeave, variables: leaveAppVars } = useMutation({
    mutationFn: (variables) => gqlClient.request(APPROVE_LEAVE, variables),
    onSuccess: () => {
      toast.success("Leave approved!");
      invalidate();
    },
    onError: handleError
  });
  
  const { mutate: rejectLeave, isPending: isRejectingLeave, variables: leaveRejVars } = useMutation({
    mutationFn: (variables) => gqlClient.request(REJECT_LEAVE, variables),
    onSuccess: () => {
      toast.success("Leave rejected!");
      invalidate();
    },
    onError: handleError
  });
  
  const { mutate: approveProfile, isPending: isApprovingProfile, variables: profAppVars } = useMutation({
    mutationFn: (variables) => gqlClient.request(APPROVE_PROFILE, variables),
    onSuccess: () => {
      toast.success("Profile update approved!");
      invalidate();
    },
    onError: handleError
  });
  
  const { mutate: rejectProfile, isPending: isRejectingProfile, variables: profRejVars } = useMutation({
    mutationFn: (variables) => gqlClient.request(REJECT_PROFILE, variables),
    onSuccess: () => {
      toast.success("Profile update rejected!");
      invalidate();
    },
    onError: handleError
  });

  const { mutate: approveOffboarding } = useMutation({
    mutationFn: (variables) => gqlClient.request(APPROVE_OFFBOARDING, variables),
    onSuccess: () => { toast.success("Offboarding approved!"); invalidate(); },
    onError: handleError
  });

  const { mutate: rejectOffboarding } = useMutation({
    mutationFn: (variables) => gqlClient.request(REJECT_OFFBOARDING, variables),
    onSuccess: () => { toast.success("Offboarding rejected!"); invalidate(); },
    onError: handleError
  });

  const { mutate: approveProbation } = useMutation({
    mutationFn: (variables) => gqlClient.request(APPROVE_PROBATION, variables),
    onSuccess: () => { toast.success("Probation request updated!"); invalidate(); },
    onError: handleError
  });

  const { mutate: requestOffboarding, isPending: isRequestingOffboarding } = useMutation({
    mutationFn: ({ id, data }) => gqlClient.request(REQUEST_OFFBOARDING, { id, input: data }),
    onSuccess: () => {
      toast.success("Offboarding request submitted for approval.");
      setShowOffboardDialog(false);
      setOffboardForm({ type: 'RESIGNATION', exitDate: '', reason: '' });
      invalidate();
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "Failed to submit offboarding request."));
    }
  });



  const approveDepartmentMutation = useMutation({
    mutationFn: async (id) => await gqlClient.request(APPROVE_DEPARTMENT, { id }),
    onSuccess: () => {
      toast.success("Department approved successfully.");
      queryClient.invalidateQueries({ queryKey: ['pendingDepartments'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, "Failed to approve department."));
    }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const safeDate = (val) => {
    if (!val) return '';
    const asNum = Number(val);
    const parsed = new Date(isNaN(asNum) ? val : asNum);
    return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
  };

  if (error) return (
    <div className="flex justify-center items-center h-64 text-red-500 bg-red-50 p-4 rounded-lg text-center max-w-lg mx-auto mt-10 shadow-sm border border-red-100">
      <AlertCircle className="w-6 h-6 mr-3 shrink-0" />
      <span>Error loading approvals: {extractErrorMessage(error)}</span>
    </div>
  );

  // Filter out the logged in user so they don't approve their own profile/tasks
  const allEmployees = (data?.employees || []).filter(e => e.id !== user?.employeeId);

  const pendingProfileReviews = allEmployees.filter(e => 
    e.employmentStatus === 'PENDING_APPROVAL' && (e.onboardingStatus === 'not_started' || !e.onboardingStatus)
  );

  const pendingTasksReviews = allEmployees.filter(e => {
    // If they are in ONGOING_ONBOARDING or PENDING_ONBOARDING
    if (['ONGOING_ONBOARDING', 'PENDING_ONBOARDING'].includes(e.employmentStatus)) {
      // Show them if they have any completed tasks that aren't approved yet
      return e.onboardingTasks?.some(t => t.isCompleted && t.status !== 'approved');
    }
    // Fallback for older states
    return e.employmentStatus === 'PENDING_APPROVAL' && (e.onboardingStatus === 'in_progress' || e.onboardingStatus === 'tasks_completed');
  });

  const pendingProbationSetups = allEmployees.filter(e => {
    if (e.employmentStatus === 'PENDING_APPROVAL' && e.onboardingStatus === 'probation_pending') return true;
    
    if (['ONGOING_ONBOARDING', 'PENDING_ONBOARDING'].includes(e.employmentStatus)) {
      if (e.onboardingTasks && e.onboardingTasks.length > 0) {
        return e.onboardingTasks.every(t => t.status === 'approved');
      }
    }
    return false;
  });
  
  const pendingProbationEnds = allEmployees.filter(e => 
    e.employmentStatus === 'PROBATION' && e.probationEndDate && new Date(safeDate(e.probationEndDate)) <= new Date()
  );

  
  const pendingDocuments = data?.documents?.filter(d => {
    // Exclude own documents
    if (d.employeeId === user?.employeeId) return false;
    if (d.status !== 'PENDING') return false;
    const emp = data?.employees?.find(e => e.id === d.employeeId);
    return emp?.employmentStatus !== 'DRAFT';
  }) || [];

  const isAdmin = ['HR_ADMIN', 'SUPER_ADMIN', 'admin'].includes(user?.role) || user?.is_organization_owner;
  const pendingLeaves = data?.leaveRequests?.filter(l => {
    // Exclude own requests
    if (l.employee?.email === user?.email || l.employeeId === user?.employeeId) return false;
    
    if (isAdmin) {
      return l.status === 'PENDING_HR' || l.status === 'PENDING_SUPER_ADMIN';
    }
    return l.status === 'PENDING';
  }) || [];
  
  const pendingProfiles = data?.profileUpdateRequests?.filter(p => {
    if (p.status !== 'PENDING') return false;
    const emp = data?.employees?.find(e => e.id === p.employeeId);
    return emp?.employmentStatus !== 'DRAFT';
  }) || [];

  const pendingOffboardings = data?.allOffboardings?.filter(o => o.status === 'PENDING') || [];
  const pendingProbations = data?.allProbationRequests?.filter(p => p.status === 'PENDING') || [];
  
  const pendingDepartments = deptData?.departments?.filter(d => d.status === 'PENDING') || [];

  const standalonePendingDocuments = pendingDocuments.filter(d => !pendingProfileReviews.some(e => e.id === d.employeeId));

  // Group by Employee for Unified View
  console.log('PendingApprovals DEBUG:', { unifiedEmployeeIdsLength: Array.from(new Set([...pendingProfileReviews.map(e => e.id), ...pendingDocuments.map(d => d.employeeId), ...pendingProfiles.map(p => p.employeeId)])).length, pendingTasksReviews: pendingTasksReviews.length, pendingProbationSetups: pendingProbationSetups.length, pendingProbationEnds: pendingProbationEnds.length, pendingProfiles: pendingProfiles.length, pendingProbations: pendingProbations.length, pendingOffboardings: pendingOffboardings.length, pendingLeaves: pendingLeaves.length });
  const unifiedEmployeeIds = Array.from(new Set([
    ...pendingProfileReviews.map(e => e.id),
    ...pendingDocuments.map(d => d.employeeId),
    ...pendingProfiles.map(p => p.employeeId)
  ]));

  const getEmployeeName = (empId) => {
    const emp = data?.employees?.find(e => e.id === empId);
    return emp ? emp.fullName : 'Unknown Employee';
  };

  const getEmployeeDept = (empId) => {
    const emp = data?.employees?.find(e => e.id === empId);
    return emp?.department?.name || 'No Dept';
  };

  const getEmployeeJobTitle = (empId) => {
    const emp = data?.employees?.find(e => e.id === empId);
    return emp?.jobTitle || 'No Title';
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 p-4 md:p-8 max-w-5xl mx-auto"
    >
      <Dialog open={!!selectedEmployeeId} onOpenChange={(open) => !open && setSelectedEmployeeId(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 border-0 bg-transparent shadow-2xl">
          <DialogTitle className="sr-only">Employee Profile</DialogTitle>
          {selectedEmployeeId && (
            <EmployeeDetail 
              employeeIdProp={selectedEmployeeId} 
              onClose={() => setSelectedEmployeeId(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
      <UnifiedProfileReviewDialog 
        open={!!selectedUnifiedEmployeeId}
        onOpenChange={(open) => !open && setSelectedUnifiedEmployeeId(null)}
        employeeId={selectedUnifiedEmployeeId}
        employeeName={getEmployeeName(selectedUnifiedEmployeeId)}
        isPendingActivation={pendingProfileReviews.some(e => e.id === selectedUnifiedEmployeeId)}
        pendingDocs={pendingDocuments.filter(d => d.employeeId === selectedUnifiedEmployeeId)}
        pendingProfiles={pendingProfiles.filter(p => p.employeeId === selectedUnifiedEmployeeId)}
      />
      <motion.div variants={itemVariants}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full mb-4">
          <Inbox className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Inbox</span>
        </div>
        
        <p className="text-slate-500 mt-1">Review and action pending requests across the organization.</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="unified" className="space-y-6">
          <TabsList className="bg-slate-50/80 border border-slate-100 p-1.5 rounded-xl flex-wrap h-auto">
            <TabsTrigger value="unified" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex gap-2">
              <UserCircle className="w-4 h-4" />
              Employee Reviews
              {(unifiedEmployeeIds.length + pendingTasksReviews.length + pendingProbationSetups.length + pendingProbationEnds.length + pendingProfiles.length + pendingProbations.length + pendingOffboardings.length) > 0 && <Badge variant="secondary" className="ml-1 bg-indigo-100 text-indigo-700 px-1.5 py-0 min-w-[20px]">{unifiedEmployeeIds.length + pendingTasksReviews.length + pendingProbationSetups.length + pendingProbationEnds.length + pendingProfiles.length + pendingProbations.length + pendingOffboardings.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="leaves" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex gap-2">
              <CalendarRange className="w-4 h-4" />
              Leave Requests
              {pendingLeaves.length > 0 && <Badge variant="secondary" className="ml-1 bg-indigo-100 text-indigo-700 px-1.5 py-0 min-w-[20px]">{pendingLeaves.length}</Badge>}
            </TabsTrigger>
            {(user?.role === 'SUPER_ADMIN' || user?.is_organization_owner) && (
              <TabsTrigger value="departments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex gap-2">
                <Building2 className="w-4 h-4" />
                Departments
                {pendingDepartments.length > 0 && <Badge variant="secondary" className="ml-1 bg-indigo-100 text-indigo-700 px-1.5 py-0 min-w-[20px]">{pendingDepartments.length}</Badge>}
              </TabsTrigger>
            )}
          </TabsList>

          <div className="pt-2">
            <TabsContent value="unified" className="m-0 focus-visible:outline-none">
              {loading ? (
                <ApprovalsSkeleton />
              ) : (unifiedEmployeeIds.length === 0 && pendingTasksReviews.length === 0 && pendingProbationSetups.length === 0 && pendingProbationEnds.length === 0 && pendingProfiles.length === 0 && pendingProbations.length === 0 && pendingOffboardings.length === 0) ? (
                <EmptyState message="No pending reviews across the organization." icon={UserCircle} />
              ) : (
                <div className="space-y-8">
                  {/* Employee Reviews (Unified View) */}
                  {unifiedEmployeeIds.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Employee Reviews</h3>
                      {unifiedEmployeeIds.map(empId => {
                        const eDocs = pendingDocuments.filter(d => d.employeeId === empId).length;
                        const eProfs = pendingProfiles.filter(p => p.employeeId === empId).length;
                        const ePendingOnboarding = pendingProfileReviews.some(e => e.id === empId);

                        return (
                          <motion.div 
                            key={empId} 
                            whileHover={{ y: -2 }}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
                          >
                            <div>
                              <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{getEmployeeName(empId)}</h4>
                              <p className="text-sm text-slate-500 mt-1">{getEmployeeJobTitle(empId)} • <span className="font-medium text-slate-600">{getEmployeeDept(empId)}</span></p>
                              <div className="flex gap-2 mt-2">
                                {ePendingOnboarding && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Pending Activation</Badge>}
                                {eProfs > 0 && <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">{eProfs} Profile Changes</Badge>}
                                {eDocs > 0 && <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">{eDocs} Documents</Badge>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button 
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-lg shadow-sm"
                                  onClick={() => setSelectedUnifiedEmployeeId(empId)}
                                >
                                  Review & Action
                                </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tasks Reviews */}
                  {pendingTasksReviews.length > 0 && (
                    <div className="space-y-3 mt-8">
                      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Completed Tasks</h3>
                      {pendingTasksReviews.map(emp => {
                        const completedTasks = emp.onboardingTasks?.filter(t => t.status === 'done') || [];
                        if (completedTasks.length === 0) return null;
                        
                        return (
                          <motion.div 
                            key={emp.id} 
                            whileHover={{ y: -2 }}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
                          >
                            <div>
                              <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.fullName}</h4>
                              <p className="text-sm text-slate-500 mt-1">{emp.jobTitle} • <span className="font-medium text-slate-600">{emp.department?.name || 'No Dept'}</span></p>
                              <p className="text-sm text-indigo-600 font-medium mt-2">{completedTasks.length} tasks completed and awaiting approval.</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-2 rounded-lg shadow-sm">
                                      <CheckCircle2 className="w-4 h-4" />
                                      View Tasks
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Completed Tasks</DialogTitle>
                                      <DialogDescription>Review the tasks completed by {emp.fullName}.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
                                      {completedTasks.map(task => (
                                        <div key={task.id} className="text-sm flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                          <div className="flex-1">
                                            <p className="text-slate-800 font-medium">{task.title}</p>
                                            <Badge variant="outline" className="text-xs mt-1 bg-white">{task.category}</Badge>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex justify-end pt-2 border-t border-slate-100">
                                      <Button 
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                                        onClick={() => approveCompletedTasks({ employeeId: emp.id, taskIds: completedTasks.map(t => t.id) })}
                                        disabled={isApprovingTasks}
                                      >
                                        {isApprovingTasks ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Approve Tasks
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Probation Setup Reviews */}
                  {pendingProbationSetups.length > 0 && (
                    <div className="space-y-3 mt-8">
                      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Set Probation Period</h3>
                      {pendingProbationSetups.map(emp => (
                          <motion.div 
                            key={emp.id} 
                            whileHover={{ y: -2 }}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
                          >
                            <div>
                              <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.fullName}</h4>
                              <p className="text-sm text-slate-500 mt-1">{emp.jobTitle} • <span className="font-medium text-slate-600">{emp.department?.name || 'No Dept'}</span></p>
                              <p className="text-sm text-indigo-600 font-medium mt-2">All tasks completed. Ready for probation setup.</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-lg shadow-sm">
                                      <CalendarRange className="w-4 h-4" />
                                      Set Probation
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Set Probation Period</DialogTitle>
                                      <DialogDescription>Define the probation start and end dates for {emp.fullName}.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={(e) => {
                                      e.preventDefault();
                                      const formData = new FormData(e.target);
                                      approveProbationSetup({ 
                                        employeeId: emp.id, 
                                        startDate: formData.get('startDate'), 
                                        endDate: formData.get('endDate') 
                                      });
                                    }} className="space-y-4 pt-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium">Start Date</label>
                                          <input type="date" name="startDate" required className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium">End Date</label>
                                          <input type="date" name="endDate" required className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm" />
                                        </div>
                                      </div>
                                      <Button type="submit" disabled={isApprovingProbationSetup} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                        {isApprovingProbationSetup ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                                      </Button>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                            </div>
                          </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Probation End Reviews */}
                  {pendingProbationEnds.length > 0 && (
                    <div className="space-y-3 mt-8">
                      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Probation Period Ended</h3>
                      {pendingProbationEnds.map(emp => (
                          <motion.div 
                            key={emp.id} 
                            whileHover={{ y: -2 }}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
                          >
                            <div>
                              <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.fullName}</h4>
                              <p className="text-sm text-slate-500 mt-1">{emp.jobTitle} • <span className="font-medium text-slate-600">{emp.department?.name || 'No Dept'}</span></p>
                              <p className="text-sm text-indigo-600 font-medium mt-2">Probation ended on {new Date(safeDate(emp.probationEndDate)).toLocaleDateString()}.</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button 
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2 rounded-lg shadow-sm"
                                  onClick={() => {
                                    setOffboardTargetId(emp.id);
                                    setShowOffboardDialog(true);
                                  }}
                                >
                                  <XCircle className="w-4 h-4" />
                                  Begin Offboarding
                                </Button>
                                <Button 
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 rounded-lg shadow-sm"
                                  onClick={() => approveProbationEnd({ employeeId: emp.id })}
                                  disabled={isApprovingProbationEnd}
                                >
                                  {isApprovingProbationEnd ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                  Change to Active
                                </Button>
                            </div>
                          </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Profile Updates */}
                  {pendingProfiles.length > 0 && (
                    <div className="space-y-3 mt-8">
                      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Profile Updates</h3>
                      {pendingProfiles.map(update => (
                        <motion.div 
                          key={update.id} 
                          whileHover={{ y: -2 }}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
                        >
                          <div>
                            <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{getEmployeeName(update.employeeId)}</h4>
                            <p className="text-sm text-slate-500 mt-1">
                              Requested change to <span className="font-semibold text-slate-700">{update.fieldName}</span>
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-sm border border-slate-100 bg-slate-50 p-2 rounded-lg inline-flex">
                              <span className="text-slate-400 line-through font-medium">{update.currentValue || '(empty)'}</span>
                              <span className="text-slate-300">→</span>
                              <span className="text-indigo-600 font-semibold">{update.requestedValue}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <RejectDialog onReject={(reason) => rejectProfile({ id: update.id, reason, attachmentUrl: "" })} title="Reject Profile Update" />
                            <Button 
                              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-lg shadow-sm"
                              onClick={() => approveProfile({ id: update.id })}
                              disabled={isApprovingProfile && profAppVars?.id === update.id}
                            >
                              {isApprovingProfile && profAppVars?.id === update.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              Approve
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Probation Requests */}
                  {pendingProbations.length > 0 && (
                    <div className="space-y-3 mt-8">
                      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Probation Requests</h3>
                      {pendingProbations.map(prob => (
                        <motion.div 
                          key={prob.id} 
                          whileHover={{ y: -2 }}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
                        >
                          <div>
                            <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{prob.employee?.fullName || 'Unknown'}</h4>
                            <p className="text-sm text-slate-500 mt-1">
                              Requested Probation Period: <span className="font-medium text-slate-700">{new Date(safeDate(prob.startDate)).toLocaleDateString()}</span> to <span className="font-medium text-slate-700">{new Date(safeDate(prob.endDate)).toLocaleDateString()}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <RejectDialog onReject={(reason) => approveProbation({ id: prob.id, status: 'REJECTED', comments: reason })} title="Reject Probation Request" />
                            <Button 
                              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-lg shadow-sm"
                              onClick={() => approveProbation({ id: prob.id, status: 'APPROVED' })}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Offboarding Requests */}
                  {pendingOffboardings.length > 0 && (
                    <div className="space-y-3 mt-8">
                      <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Offboarding Requests</h3>
                      {pendingOffboardings.map(off => (
                        <motion.div 
                          key={off.id} 
                          whileHover={{ y: -2 }}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
                        >
                          <div>
                            <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{off.employee?.fullName || 'Unknown'}</h4>
                            <p className="text-sm text-slate-500 mt-1">
                              Offboarding Type: <span className="font-semibold text-slate-700">{off.exitType}</span> • Exit Date: <span className="font-medium text-slate-700">{new Date(safeDate(off.exitDate)).toLocaleDateString()}</span>
                            </p>
                            {off.reason && <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">"{off.reason}"</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <RejectDialog onReject={(reason) => rejectOffboarding({ id: off.id, comments: reason })} title="Reject Offboarding" />
                            <Button 
                              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-lg shadow-sm"
                              onClick={() => approveOffboarding({ id: off.id })}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="leaves" className="m-0 focus-visible:outline-none">
              {loading ? (
                <ApprovalsSkeleton />
              ) : pendingLeaves.length === 0 ? (
                <EmptyState message="No pending leave requests." icon={CalendarRange} />
              ) : (
                <div className="space-y-3">
                  {pendingLeaves.map(leave => (
                    <motion.div 
                      key={leave.id} 
                      whileHover={{ y: -2 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{getEmployeeName(leave.employeeId)}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium py-0 h-5 text-[10px]">
                            {leave.totalDays} Days
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {safeDate(leave.startDate).toLocaleDateString()} <span className="text-slate-300 mx-1">→</span> {safeDate(leave.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        {leave.reason && <p className="text-sm text-slate-500 italic mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">"{leave.reason}"</p>}
                        {leave.attachmentUrl && (
                           <div className="mt-2">
                             <a 
                               href={leave.attachmentUrl} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                             >
                               <FileText className="w-3 h-3" /> View Attachment
                             </a>
                           </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <RejectDialog onReject={(reason) => rejectLeave({ id: leave.id, reason, attachmentUrl: "" })} title="Reject Leave Request" />
                        <Button 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-lg shadow-sm"
                          onClick={() => approveLeave({ id: leave.id })}
                          disabled={isApprovingLeave && leaveAppVars?.id === leave.id}
                        >
                          {isApprovingLeave && leaveAppVars?.id === leave.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="departments" className="m-0 focus-visible:outline-none">
              {deptLoading ? (
                <ApprovalsSkeleton />
              ) : pendingDepartments.length === 0 ? (
                <EmptyState message="No pending departments across the organization." icon={Building2} />
              ) : (
                <div className="space-y-4">
                  {pendingDepartments.map(dept => (
                    <Card key={dept.id} className="overflow-hidden border-slate-200">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                              <Building2 className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                                <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">New Department</Badge>
                              </div>
                              <p className="text-sm text-slate-500 mb-1">Code: {dept.code || 'N/A'}</p>
                            </div>
                          </div>
                          
                          {isAdmin && (
                            <div className="flex items-center gap-2 shrink-0">
                              <Button 
                                onClick={() => approveDepartmentMutation.mutate(dept.id)}
                                disabled={approveDepartmentMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
                              >
                                {approveDepartmentMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

          </div>
        </Tabs>
      </motion.div>

      {/* Offboard Dialog */}
      <Dialog open={showOffboardDialog} onOpenChange={setShowOffboardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Offboard Employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Exit Type</Label>
              <Select value={offboardForm.type} onValueChange={v => setOffboardForm({ ...offboardForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESIGNATION">Resigned</SelectItem>
                  <SelectItem value="TERMINATION">Terminated / Fired</SelectItem>
                  <SelectItem value="RETIREMENT">Retirement</SelectItem>
                  <SelectItem value="CONTRACT_EXPIRATION">Contract Expiration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Exit Date</Label>
              <Input type="date" value={offboardForm.exitDate} onChange={e => setOffboardForm({ ...offboardForm, exitDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={offboardForm.reason} onChange={e => setOffboardForm({ ...offboardForm, reason: e.target.value })} placeholder="Reason for leaving..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOffboardDialog(false)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                requestOffboarding({
                  id: offboardTargetId,
                  data: {
                    exitType: offboardForm.type,
                    exitDate: offboardForm.exitDate,
                    reason: offboardForm.reason
                  }
                });
              }}
              disabled={isRequestingOffboarding}
            >
              {isRequestingOffboarding ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
