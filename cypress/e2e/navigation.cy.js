/**
 * Cypress E2E Tests: Navigation & Routing
 * Tests: All sidebar links, page transitions, URL correctness
 */

describe('Navigation & Routing', () => {
  beforeEach(() => {
    cy.fixture('users').then(({ superAdmin }) => {
      cy.loginByApi(superAdmin.email, superAdmin.password)
      cy.visit('/')
    })
  })

  const adminRoutes = [
    { label: 'Dashboard', path: '/' },
    { label: 'Employees', path: '/Employees' },
    { label: 'Payroll', path: '/Payroll' },
    { label: 'Loans', path: '/Loans' },
    { label: 'Expenses', path: '/Expenses' },
    { label: 'Performance', path: '/Performance' },
  ]

  context('Direct URL Navigation', () => {
    adminRoutes.forEach(({ label, path }) => {
      it(`navigates to ${label} page at ${path}`, () => {
        cy.visit(path)
        cy.url({ timeout: 8000 }).should('match', new RegExp(path === '/' ? '\\/$' : path, 'i'))
        cy.get('main').should('be.visible')
      })
    })
    
    // Test Attendance separately in case it's disabled in prod
    it('navigates to Attendance page at /Attendance (if enabled)', () => {
      cy.visit('/Attendance', { failOnStatusCode: false })
      cy.get('main', { timeout: 8000 }).should('exist')
    })
  })

  context('Sidebar Link Navigation', () => {
    it('Dashboard link navigates to root', () => {
      cy.get('[data-cy="nav-primary-dashboard"]').first().click()
      cy.contains('a', /overview/i).click({ force: true })
      cy.url().should('eq', Cypress.config('baseUrl') + '/')
    })

    it('Employees link navigates to employees page', () => {
      cy.get('[data-cy="nav-primary-employees"]').click()
      // The first sub-item is All Employees, which has href /Employees
      cy.contains('a', /all employees/i).click({ force: true })
      cy.url({ timeout: 8000 }).should('match', /\/employees/i)
    })

    it('Payroll group expands to show sub-items', () => {
      cy.get('[data-cy="nav-primary-payroll"]').click()
      cy.contains(/loans/i, { timeout: 5000 }).should('be.visible')
      cy.contains(/expenses/i).should('be.visible')
    })

    it('Loans sub-link navigates to loans page', () => {
      cy.get('[data-cy="nav-primary-payroll"]').click()
      cy.contains('a', /loans/i).click({ force: true })
      cy.url({ timeout: 8000 }).should('match', /\/loans/i)
    })

    it('Expenses sub-link navigates to expenses page', () => {
      cy.get('[data-cy="nav-primary-payroll"]').click()
      cy.contains('a', /expenses/i).click({ force: true })
      cy.url({ timeout: 8000 }).should('match', /\/expenses/i)
    })

    it('Performance link navigates correctly', () => {
      cy.get('[data-cy="nav-primary-performance"]').click()
      cy.contains('a', /reviews/i).click({ force: true })
      cy.url({ timeout: 8000 }).should('match', /\/performance/i)
    })
  })

  context('Page Not Found', () => {
    it('shows 404 page for unknown routes', () => {
      cy.visit('/this-route-does-not-exist-xyz', { failOnStatusCode: false })
      cy.contains(/not found|404|page.*not.*exist/i, { timeout: 8000 }).should('be.visible')
    })
  })

  context('Settings (Admin Only)', () => {
    it('Settings link is visible for admins in sidebar', () => {
      cy.get('[data-cy="nav-primary-settings"], button[aria-label="Settings"], a[aria-label="Settings"]').should('exist')
    })

    it('Settings link navigates to Settings page', () => {
      cy.get('[data-cy="nav-primary-settings"], button[aria-label="Settings"], a[aria-label="Settings"]').first().click({ force: true })
      cy.contains('a', /general settings/i).click({ force: true })
      cy.url({ timeout: 8000 }).should('match', /\/settings/i)
    })
  })
})
