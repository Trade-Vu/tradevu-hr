/**
 * Cypress E2E Tests: PRD 02 - Employee Core
 * Tests: Employee Portal (ESS), Directory, Org Chart, Compliance & Expirations
 */

describe('PRD 02 - Employee Core', () => {
  beforeEach(() => {
    cy.loginByApi()
  })

  context('Directory & Org Chart', () => {
    beforeEach(() => {
      // Mock employees and departments for the org chart
      cy.interceptGQL('GetOrganogramEmployees', {
        data: {
          departments: [
            { id: 'd1', name: 'Engineering', headEmployeeId: 'e1', employees: [{ id: 'e1', fullName: 'Alice' }, { id: 'e2', fullName: 'Bob' }] }
          ],
          employees: [
            { id: 'e1', fullName: 'Alice', jobTitle: 'VP of Engineering' },
            { id: 'e2', fullName: 'Bob', jobTitle: 'Software Engineer' }
          ],
          me: { id: 'e1', role: 'SUPER_ADMIN' }
        }
      })
      
      cy.visit('/Organogram')
      cy.wait('@GetOrganogramEmployees')
    })

    it('renders the Org Chart (Organogram) correctly', () => {
      cy.contains('Organogram').should('be.visible')

      cy.contains('Alice').should('be.visible')
      cy.contains('Bob').should('be.visible')
    })
  })

  context('Employee Portal & Compliance', () => {
    beforeEach(() => {
      // Mock GetEmployee query
      cy.interceptGQL('GetEmployee', {
        data: {
          employee: {
            id: 'e2',
            fullName: 'Bob Worker',
            email: 'bob@tradevu.com',
            privateEmail: null,
            phone: null,
            dateOfBirth: null,
            gender: null,
            maritalStatus: null,
            nationality: null,
            nationalId: null,
            passportNumber: null,
            jobTitle: 'Engineer',
            departmentId: 'd1',
            employmentStatus: 'ACTIVE',
            employmentType: null,
            hireDate: null,
            basicSalary: null,
            allowances: null
          }
        }
      })
      
      cy.interceptGQL('GetDocs', {
        data: {
          documents: [
            { id: 'doc1', name: 'Visa', category: 'Immigration', fileUrl: 'x', fileType: 'PDF', fileSize: 100, visibilityLevel: 'PRIVATE', status: 'VALID', currentVersion: 1, createdAt: '2025' },
            { id: 'doc2', name: 'Passport', category: 'ID', fileUrl: 'x', fileType: 'PDF', fileSize: 100, visibilityLevel: 'PRIVATE', status: 'EXPIRING_SOON', currentVersion: 1, createdAt: '2025' }
          ]
        }
      })

      cy.visit('/EmployeeDetail?id=e2')
      cy.wait('@GetEmployee')
    })

    it('renders employee details in ESS view', () => {
      cy.contains('Bob Worker').should('be.visible')
      cy.contains('Engineer').should('be.visible')
    })

    it('displays compliance alerts for expiring documents', () => {
      // Navigate to the Documents tab
      cy.contains('Documents').click()
      cy.wait('@GetDocs')
      cy.contains('Passport').should('be.visible')
      cy.contains('EXPIRING_SOON').should('be.visible')
    })
  })
})
