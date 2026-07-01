import { graphql, HttpResponse } from 'msw';

// Define the GraphQL handlers
export const handlers = [
  // Intercept the 'GetOrganization' query
  graphql.query('GetOrganization', () => {
    return HttpResponse.json({
      data: {
        organization: {
          id: 'org1',
          employeeClasses: ['Permanent', 'Contract', 'Managerial', 'Intern']
        }
      }
    });
  }),

  // Intercept the 'GetLeaveTypes' query
  graphql.query('GetLeaveTypes', () => {
    return HttpResponse.json({
      data: {
        leaveTypes: [
          {
            id: '1',
            name: 'Annual Leave',
            daysPerYear: 20,
            isPaid: true,
            requiresApproval: true,
            applicableTo: { classOverrides: { Manager: 25 } },
          },
        ],
      },
    });
  }),

  // Intercept the 'UpdateLeaveType' mutation
  graphql.mutation('UpdateLeaveType', ({ variables }) => {
    return HttpResponse.json({
      data: {
        updateLeaveType: {
          id: variables.id,
          name: variables.name,
          daysPerYear: variables.daysPerYear,
          isPaid: variables.isPaid,
          requiresApproval: variables.requiresApproval,
          applicableTo: variables.applicableTo,
        },
      },
    });
  }),
];
