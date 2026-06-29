/**
 * Cypress E2E Tests: PRD 04 - Payroll & Compensation
 * Tests: Payroll Runs, Payslips, Approvals
 */

describe('PRD 04 - Payroll & Compensation', () => {
  beforeEach(() => {
    cy.loginByApi()
  })

  context('Payroll Runs', () => {
    beforeEach(() => {
      // Mock payroll runs query
      cy.interceptGQL('payrollRuns', {
        data: {
          payrollRuns: [
            { id: 'pr1', month: '2026-05', periodStart: '2026-05-01', periodEnd: '2026-05-31', status: 'DRAFT', totalGross: 500000, totalNet: 450000, processedBy: 'Admin' }
          ]
        }
      })

      cy.visit('/Payroll')
      cy.wait('@payrollRuns')
    })

    it('renders the Payroll page and displays history', () => {
      cy.contains('Generate and manage monthly payroll runs').should('be.visible')
      cy.contains('Generate Payroll Run').should('be.visible')
      cy.contains('2026-05').should('be.visible')
      cy.contains('DRAFT').should('be.visible')
    })

    it('generates a new payroll run', () => {
      cy.interceptGQL('CreateRun', {
        data: { createPayrollRun: { id: 'pr2' } }
      })

      cy.interceptGQL('payrollRuns', {
        data: {
          payrollRuns: [
            { id: 'pr1', month: '2026-05', periodStart: '2026-05-01', periodEnd: '2026-05-31', status: 'DRAFT', totalGross: 500000, totalNet: 450000, processedBy: 'Admin' },
            { id: 'pr2', month: '2026-06', periodStart: '2026-06-01', periodEnd: '2026-06-30', status: 'DRAFT', totalGross: 500000, totalNet: 450000, processedBy: 'Admin' }
          ]
        }
      })

      cy.contains('Generate Payroll Run').click()
      cy.get('button').contains(/^Generate$/).click()

      cy.wait('@payrollRuns')
      cy.contains('2026-06').should('be.visible')
    })

    it('views payroll run details', () => {
      cy.interceptGQL('GetRecords', {
        data: {
          payrollRecords: [
            { id: 'rec1', employee: { fullName: 'Alice' }, basicSalary: 300000, allowances: 50000, grossPay: 350000, taxAmount: 50000, otherDeductions: 10000, netPay: 290000 }
          ]
        }
      })

      // Click on the View Records button
      cy.contains('View Records').click()
      cy.wait('@GetRecords')

      cy.contains('Payroll Records for 2026-05').should('be.visible')
      cy.contains('Alice').should('be.visible')
      cy.contains('290,000 NGN').should('be.visible')
    })

    it('simulates async payslip generation', () => {
      cy.interceptGQL('GetRecords', {
        data: {
          payrollRecords: [
            { id: 'rec1', employee: { fullName: 'Alice' }, basicSalary: 300000, allowances: 50000, grossPay: 350000, taxAmount: 50000, otherDeductions: 10000, netPay: 290000 }
          ]
        }
      })

      cy.interceptGQL('GenPayslip', {
        data: { generatePayslip: 'https://example.com/payslip.pdf' }
      })

      cy.contains('View Records').click()
      cy.wait('@GetRecords')

      cy.contains('Payslip').click()
      cy.contains('Generating...').should('be.visible')
      cy.wait('@GenPayslip')
    })
  })
})
