/**
 * Cypress E2E Tests: PRD 04 - Payroll & Compensation
 * Tests: Payroll Runs, Payslips, Approvals
 *
 * Payroll.jsx was migrated off the legacy GraphQL backend onto the NestJS
 * REST API (see tradevu-hr-backend `/api/v1/payroll/*`), so this spec mocks
 * REST responses via cy.intercept instead of cy.interceptGQL.
 *
 * Note: `cy.loginByApi()` sets a fake token and only intercepts the legacy
 * GraphQL `Me` query; AuthContext actually calls REST `GET /auth/me`, which
 * this spec intercepts locally below. That REST auth mock is currently
 * missing from the shared `loginByApi` command for every other spec too —
 * out of scope for this payroll-focused change, but worth fixing in
 * cypress/support/commands.js separately.
 */

describe('PRD 04 - Payroll & Compensation', () => {
  beforeEach(() => {
    cy.loginByApi()

    cy.intercept('GET', '**/api/v1/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: '1',
          email: 'superadmin@tradevu.com',
          role: 'SUPER_ADMIN',
          organizationId: 'org1',
          employeeId: 'emp1',
          isOrgOwner: true,
        },
      },
    }).as('getMe')
  })

  context('Payroll Runs', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/payroll/runs*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            data: [
              {
                _id: 'run-1',
                month: '2026-05',
                periodStart: '2026-05-01',
                periodEnd: '2026-05-31',
                status: 'draft',
                totalGross: 500000,
                totalNet: 450000,
                totalDeductions: 50000,
                employeeCount: 1,
              },
            ],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          },
        },
      }).as('getRuns')

      cy.visit('/Payroll')
      cy.wait(['@getMe', '@getRuns'])
    })

    it('renders the Payroll page and displays run history', () => {
      cy.contains('Generate and manage monthly payroll runs').should('be.visible')
      cy.contains('Generate Payroll Run').should('be.visible')
      cy.contains('2026-05').should('be.visible')
      cy.contains('draft').should('be.visible')
    })

    it('generates a new payroll run', () => {
      cy.intercept('POST', '**/api/v1/payroll/runs', {
        statusCode: 201,
        body: {
          success: true,
          data: { _id: 'run-2', month: '2026-06', status: 'draft' },
        },
      }).as('createRun')

      cy.contains('Generate Payroll Run').click()

      cy.get('input[type="month"]').first().type('2026-06')
      cy.get('input[type="date"]').eq(0).type('2026-06-01')
      cy.get('input[type="date"]').eq(1).type('2026-06-30')

      cy.get('button').contains(/^Generate$/).click()

      cy.wait('@createRun')
    })

    it('views payroll run details and its records', () => {
      cy.intercept('GET', '**/api/v1/payroll/runs/run-1', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            _id: 'run-1',
            month: '2026-05',
            status: 'draft',
            totalGross: 350000,
            totalNet: 290000,
            totalDeductions: 60000,
          },
        },
      }).as('getRun')

      cy.intercept('GET', '**/api/v1/payroll/runs/run-1/records*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            data: [
              {
                _id: 'rec1',
                employeeId: { fullName: 'Alice', employeeCode: 'EMP0001' },
                basicSalary: 300000,
                grossPay: 350000,
                taxAmount: 50000,
                netPay: 290000,
              },
            ],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          },
        },
      }).as('getRunRecords')

      cy.contains('View Records').click()
      cy.wait(['@getRun', '@getRunRecords'])

      cy.contains('Alice').should('be.visible')
      cy.contains('290,000').should('be.visible')
    })

    it('downloads a payslip PDF for a record', () => {
      cy.intercept('GET', '**/api/v1/payroll/runs/run-1', {
        statusCode: 200,
        body: { success: true, data: { _id: 'run-1', month: '2026-05', status: 'draft' } },
      })
      cy.intercept('GET', '**/api/v1/payroll/runs/run-1/records*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            data: [{ _id: 'rec1', employeeId: { fullName: 'Alice' }, grossPay: 350000, netPay: 290000 }],
            meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
          },
        },
      }).as('getRunRecords')
      cy.intercept('GET', '**/api/v1/payroll/payslips/rec1/pdf', {
        statusCode: 200,
        headers: { 'content-type': 'application/pdf' },
        body: '%PDF-1.4 mock',
      }).as('downloadPayslip')

      cy.contains('View Records').click()
      cy.wait('@getRunRecords')

      cy.contains('Payslip').click()
      cy.wait('@downloadPayslip')
    })
  })
})
