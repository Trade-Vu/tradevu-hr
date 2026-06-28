/**
 * Cypress E2E Tests: PRD 01 - Platform Governance
 * Tests: Organization setup, Departments, Approvals, and Settings
 */

describe('PRD 01 - Platform Governance', () => {
  beforeEach(() => {
    // Standard mock login
    cy.loginByApi('superadmin@tradevu.com', 'Admin@12345')
  })

  context('Settings Page - Departments', () => {
    beforeEach(() => {
      // Mock the initial load of departments and employees
      cy.interceptGQL('GetDepartmentsAndEmployees', {
        data: {
          departments: [
            { id: 'd1', name: 'Engineering', code: 'ENG', status: 'APPROVED', headEmployeeId: 'e1', employees: [] }
          ],
          employees: [
            { id: 'e1', fullName: 'Alice Head', email: 'alice@tradevu.com', jobTitle: 'VP' },
            { id: 'e2', fullName: 'Bob Worker', email: 'bob@tradevu.com', jobTitle: 'Engineer' }
          ],
          me: { id: 'm1', role: 'SUPER_ADMIN' }
        }
      }).as('GetDept')
      cy.visit('/Settings')
      cy.wait('@GetDepartmentsAndEmployees')
      // Switch to Departments tab
      cy.contains('Departments').click()
    })

    it('renders the departments list', () => {
      cy.contains('Departments & Hierarchy').should('be.visible')
      cy.contains('Engineering').should('be.visible')
      cy.contains('Code: ENG').should('be.visible')
    })

    it('creates a new department', () => {
      cy.interceptGQL('CreateDepartment', {
        data: { createDepartment: { id: 'd2' } }
      })

      // We need to re-mock the get query to show the new department after invalidation
      cy.interceptGQL('GetDepartmentsAndEmployees', {
        data: {
          departments: [
            { id: 'd1', name: 'Engineering', code: 'ENG', status: 'APPROVED', headEmployeeId: 'e1', employees: [] },
            { id: 'd2', name: 'Marketing', code: 'MKT', status: 'PENDING', headEmployeeId: 'e2', employees: [] }
          ],
          employees: [
            { id: 'e1', fullName: 'Alice Head', email: 'alice@tradevu.com', jobTitle: 'VP' },
            { id: 'e2', fullName: 'Bob Worker', email: 'bob@tradevu.com', jobTitle: 'Engineer' }
          ],
          me: { id: 'm1', role: 'SUPER_ADMIN' }
        }
      })

      cy.contains('Create Department').click()
      
      // Fill form
      cy.get('input').eq(0).type('Marketing') // Department Name
      cy.get('input').eq(1).type('MKT') // Code
      cy.get('button[role="combobox"]').click() // Open Select for Head
      cy.get('[role="option"]').contains('Bob Worker').click()
      
      cy.get('form').contains('Create').click()

      // Wait for re-fetch and check visibility
      cy.wait('@GetDepartmentsAndEmployees')
      cy.contains('Marketing').should('be.visible')
      cy.contains('Pending Approval').should('be.visible')
    })

    it('approves a pending department (Critical Path)', () => {
      // Mock the initial state with a pending department
      cy.interceptGQL('GetDepartmentsAndEmployees', {
        data: {
          departments: [
            { id: 'd2', name: 'Marketing', code: 'MKT', status: 'PENDING', headEmployeeId: 'e2', employees: [] }
          ],
          employees: [],
          me: { id: 'm1', role: 'SUPER_ADMIN' }
        }
      })
      
      cy.interceptGQL('ApproveDepartment', {
        data: { approveDepartment: { id: 'd2' } }
      })

      // The updated state after approval
      let approveCalled = false;
      cy.intercept('POST', Cypress.env('graphqlUrl'), (req) => {
        if (req.body.operationName === 'ApproveDepartment') {
          approveCalled = true;
          req.reply({ data: { approveDepartment: { id: 'd2' } } })
        } else if (req.body.operationName === 'GetDepartmentsAndEmployees' && approveCalled) {
          req.alias = 'GetDepartmentsAndEmployeesAfterApprove';
          req.reply({
            data: {
              departments: [
                { id: 'd2', name: 'Marketing', code: 'MKT', status: 'APPROVED', headEmployeeId: 'e2', employees: [] }
              ],
              employees: [],
              me: { id: 'm1', role: 'SUPER_ADMIN' }
            }
          })
        }
      })

      cy.reload() // Reload to ensure fresh state with our mock
      cy.contains('Departments').click() // Need to switch to the tab again
      cy.contains('Marketing').should('be.visible')
      cy.contains('PENDING').should('be.visible')
      
      // Click Approve
      cy.contains('Approve').click()

      // Should show as APPROVED
      cy.wait('@GetDepartmentsAndEmployeesAfterApprove')
      cy.contains('APPROVED').should('be.visible')
    })
  })

  context('Settings Page - Workflows & Shifts', () => {
    beforeEach(() => {
      cy.visit('/Settings')
    })

    it('displays the Approval Workflows tab by default', () => {
      cy.contains('Approval Workflows').should('be.visible')
    })

    it('creates a new shift (Happy Path)', () => {
      cy.contains('Shifts').click()
      cy.contains('Add Shift').click()
      
      // We rely on the frontend mock for shifts currently defined in Settings.jsx
      cy.get('input').eq(0).type('Night Shift')
      cy.get('input').eq(1).type('N')
      
      cy.get('form').contains('Create').click()
      
      // Check the shift is created in UI
      cy.contains('Night Shift').should('be.visible')
    })
  })
})
