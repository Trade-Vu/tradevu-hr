export const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    role: String!
    organizationId: String!
    employeeId: String
    isOrgOwner: Boolean
    lastLogin: String
    avatarUrl: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Organization {
    id: ID!
    name: String!
    country: String
    subscriptionPlan: String
    ownerEmail: String!
  }

  type Employee {
    id: ID!
    employeeCode: String!
    fullName: String!
    email: String!
    jobTitle: String!
    departmentId: String
    employmentStatus: String!
    hireDate: String!
  }

  type Department {
    id: ID!
    name: String!
    code: String
    headEmployeeId: String
  }

  type LeaveType {
    id: ID!
    name: String!
    daysPerYear: Int!
    isPaid: Boolean!
    requiresApproval: Boolean!
  }

  type LeaveRequest {
    id: ID!
    employeeId: String!
    leaveTypeId: String!
    startDate: String!
    endDate: String!
    totalDays: Float!
    status: String!
    reason: String
    createdAt: String!
  }

  type Attendance {
    id: ID!
    employeeId: String!
    date: String!
    clockIn: String
    clockOut: String
    status: String!
  }

  type Document {
    id: ID!
    employeeId: String!
    name: String!
    category: String!
    fileUrl: String!
    fileType: String!
    visibilityLevel: String!
    status: String!
  }

  type Notification {
    id: ID!
    userId: String!
    title: String!
    message: String!
    category: String!
    isRead: Boolean!
    createdAt: String!
  }

  type PayrollRun {
    id: ID!
    month: String!
    periodStart: String!
    periodEnd: String!
    status: String!
    totalGross: Float!
    totalNet: Float!
    createdAt: String!
  }

  type PayrollRecord {
    id: ID!
    employeeId: String!
    basicSalary: Float!
    grossPay: Float!
    totalDeductions: Float!
    netPay: Float!
    payslipUrl: String
  }

  type Policy {
    id: ID!
    title: String!
    category: String!
    content: String
    status: String!
    requiresAck: Boolean!
  }

  type Announcement {
    id: ID!
    title: String!
    content: String!
    priority: String!
    createdAt: String!
  }

  type Goal {
    id: ID!
    title: String!
    description: String
    weight: Float!
    status: String!
    period: String!
  }

  type Query {
    me: User
    organization(id: ID!): Organization
    employees: [Employee]
    employee(id: ID!): Employee
    departments: [Department]
    
    # Phase 2 Queries
    leaveTypes: [LeaveType]
    leaveRequests(employeeId: ID): [LeaveRequest]
    attendanceRecords(employeeId: ID, date: String): [Attendance]
    documents(employeeId: ID!): [Document]
    notifications: [Notification]

    # Phase 3 Queries
    payrollRuns: [PayrollRun]
    payrollRecords(payrollRunId: ID!): [PayrollRecord]
    myPayrollRecords: [PayrollRecord]

    # Phase 4 Queries
    policies: [Policy]
    announcements: [Announcement]
    goals(employeeId: ID!): [Goal]
  }

  input RegisterInput {
    email: String!
    password: String!
    orgName: String!
  }

  input EmployeeInput {
    fullName: String!
    email: String!
    jobTitle: String!
    departmentId: String
    hireDate: String!
    basicSalary: Float
  }

  input LeaveRequestInput {
    leaveTypeId: String!
    startDate: String!
    endDate: String!
    totalDays: Float!
    reason: String
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    
    createEmployee(input: EmployeeInput!): Employee!
    deleteEmployee(id: ID!): Boolean
    
    createDepartment(name: String!, code: String): Department!

    # Phase 2 Mutations
    createLeaveType(name: String!, daysPerYear: Int!, isPaid: Boolean, requiresApproval: Boolean): LeaveType!
    submitLeaveRequest(input: LeaveRequestInput!): LeaveRequest!
    approveLeaveRequest(id: ID!): LeaveRequest!
    rejectLeaveRequest(id: ID!): LeaveRequest!
    
    clockIn: Attendance!
    clockOut: Attendance!
    
    uploadDocument(employeeId: ID!, name: String!, category: String!, fileUrl: String!, fileType: String!, visibilityLevel: String!): Document!
    
    markNotificationRead(id: ID!): Notification!

    # Phase 3 Mutations
    createPayrollRun(month: String!, periodStart: String!, periodEnd: String!): PayrollRun!
    approvePayrollRun(id: ID!): PayrollRun!
    generatePayslip(recordId: ID!): String!

    # Phase 4 Mutations
    createPolicy(title: String!, category: String!, content: String, requiresAck: Boolean): Policy!
    acknowledgePolicy(policyId: ID!): Boolean
    createAnnouncement(title: String!, content: String!, priority: String!): Announcement!
    createGoal(employeeId: ID!, title: String!, weight: Float!, period: String!): Goal!
  }
`;
