/**
 * Cypress E2E Tests: PRD 03 - Document Management
 * Tests: Knowledge Bank (Policies) and HR Letters
 */

describe('PRD 03 - Document Management', () => {
  beforeEach(() => {
    cy.loginByApi()
  })

  context('Knowledge Bank', () => {
    beforeEach(() => {
      cy.interceptGQL('GetPolicies', {
        data: {
          policies: [
            { id: 'p1', title: 'Employee Handbook', category: 'HR', summary: 'The handbook.', fileUrl: 'x', effectiveDate: '2025', lastReviewed: '2025', status: 'ACTIVE', version: '1.0' }
          ]
        }
      })
      cy.visit('/KnowledgeBank')
      cy.wait('@GetPolicies')
    })

    it('renders the knowledge bank with folders and policies', () => {
      cy.contains('Knowledge Bank').should('be.visible')
      cy.get('input[placeholder*="Search documents"]').should('be.visible')
      
      // Look for upload button or specific folder
      cy.contains('Publish Document').should('be.visible')
    })

    it('can search for a document', () => {
      cy.get('input[placeholder*="Search documents"]').type('Employee Handbook')
      // Depending on mock data, wait for results
      cy.contains('Employee Handbook', { timeout: 5000 }).should('be.visible')
    })
  })

  context('HR Letters', () => {
    beforeEach(() => {
      cy.visit('/HRLetters')
    })

    it('renders the HR Letters page', () => {
      cy.contains('HR Letters').should('be.visible')
      cy.contains('Request Letter').should('be.visible')
    })

    it('opens the generate letter dialog', () => {
      cy.contains('Request Letter').click()
      cy.contains('Request HR Letter').should('be.visible')
      
      // Check for template selection
      cy.contains('Letter Type').should('be.visible')
    })
  })
})
