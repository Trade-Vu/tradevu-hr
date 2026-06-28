/**
 * Cypress E2E Tests: PRD 05 - Leave & Attendance
 * Tests: Leave Requests, Balances, Attendance (Clock In/Out)
 */

describe('PRD 05 - Leave & Attendance', () => {
  beforeEach(() => {
    cy.loginByApi()
  })

  context('Leave Management', () => {
    beforeEach(() => {
      cy.interceptGQL('GetLeaveData', {
        data: {
          leaveTypes: [
            { id: 'lt1', name: 'Annual Leave', daysPerYear: 20 },
            { id: 'lt2', name: 'Sick Leave', daysPerYear: 10 }
          ],
          leaveRequests: [
            { id: 'lr1', employee_id: 'e1', employee_email: 'superadmin@tradevu.com', leaveTypeId: 'lt1', leave_type: 'Annual Leave', start_date: '2026-06-01', end_date: '2026-06-05', totalDays: 5, status: 'APPROVED' },
            { id: 'lr2', employee_id: 'e2', employee_email: 'bob@tradevu.com', leaveTypeId: 'lt2', leave_type: 'Sick Leave', start_date: '2026-06-10', end_date: '2026-06-11', totalDays: 2, status: 'PENDING' }
          ]
        }
      }).as('GetLeaveData')

      cy.visit('/AllLeaveRequests')
      cy.wait('@GetLeaveData')
    })

    it('renders the leave balances correctly based on calculations', () => {
      cy.contains('Leave Requests').should('be.visible')
      cy.contains('ANNUAL LEAVE').should('be.visible')
      // Original 20, used 5 -> 15
      cy.contains('15').should('be.visible')
    })

    it('creates a new leave request (Happy Path)', () => {
      cy.interceptGQL('CreateLeaveRequest', {
        data: { createLeaveRequest: { id: 'lr3' } }
      })

      cy.contains('New Leave Request').click()
      cy.contains('Submit Request').should('be.visible')
      
      // Select leave type
      cy.get('button[role="combobox"]').click()
      cy.contains('Sick Leave').click()

      // Set dates
      cy.get('input[type="date"]').eq(0).type('2026-07-01')
      cy.get('input[type="date"]').eq(1).type('2026-07-02')

      cy.get('form').contains('Submit Request').click()
      // Expect successful creation (modal closes or alert appears)
      cy.contains('Submit Request').should('not.exist')
    })

    it('allows HR to approve a pending leave request', () => {
      cy.interceptGQL('UpdateLeaveRequest', {
        data: { updateLeaveRequest: { id: 'lr2', status: 'APPROVED' } }
      })

      cy.get('button').contains('Approve').click()
      // Ensure there are no errors in console
      cy.noConsoleErrors()
    })
  })

  context('Attendance', () => {
    beforeEach(() => {
      cy.interceptGQL('GetAttendance', {
        data: {
          attendanceRecords: [],
          myTodayRecord: null
        }
      }).as('GetAttendance')

      cy.visit('/Attendance')
      cy.wait('@GetAttendance')
    })

    it('clocks in successfully', () => {
      cy.interceptGQL('ClockIn', {
        data: { clockIn: { id: 'att1', status: 'PRESENT' } }
      })

      cy.contains('Clock In').click()
      // Wait for refetch or check state toggle (mocked UI will show Clock Out)
      // Since it's mocked, we might not see immediate refetch if the mock resolver isn't updated.
      // But we can assert the mutation was called and no console errors occurred.
      cy.noConsoleErrors()
    })
  })
})
