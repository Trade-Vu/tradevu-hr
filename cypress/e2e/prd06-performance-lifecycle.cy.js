/**
 * Cypress E2E Tests: PRD 06 - Performance & Lifecycle
 * Tests: Performance (Goals, Check-ins), Onboarding, Company Wall
 */

describe('PRD 06 - Performance & Lifecycle', () => {
  beforeEach(() => {
    cy.loginByApi()
  })

  context('Performance', () => {
    beforeEach(() => {
      cy.interceptGQL('GetGoals', {
        data: {
          goals: [
            { id: 'g1', title: 'Increase Sales by 10%', weight: 40, status: 'IN_PROGRESS', progress: 50, period: 'Q2 2026' }
          ]
        }
      }).as('GetGoals')

      cy.interceptGQL('GetCheckIns', {
        data: {
          checkIns: [
            { id: 'c1', month: 'June 2026', status: 'SCHEDULED', manager_notes: '', employee_notes: '' }
          ]
        }
      }).as('GetCheckIns')

      cy.visit('/Performance')
      cy.wait('@GetGoals')
    })

    it('renders goals and their weights', () => {
      cy.contains('Performance Management').should('be.visible')
      cy.contains('Increase Sales by 10%').should('be.visible')
      cy.contains('40% weight').should('be.visible')
    })

    it('creates a new goal', () => {
      cy.interceptGQL('CreateGoal', {
        data: { createGoal: { id: 'g2' } }
      })

      cy.contains('New Goal').click()
      cy.get('input[placeholder*="Goal Title"]').type('Improve code coverage')
      cy.get('input[type="number"]').type('20')
      cy.get('button').contains('Create Goal').click()
      
      cy.noConsoleErrors()
    })

    it('views and submits a self-appraisal for a check-in', () => {
      cy.contains('Monthly Check-ins').click()
      cy.wait('@GetCheckIns')

      cy.contains('June 2026').should('be.visible')
      cy.contains('SCHEDULED').should('be.visible')

      cy.interceptGQL('UpdateCheckIn', {
        data: { updateCheckIn: { id: 'c1', status: 'COMPLETED' } }
      })

      cy.contains('Start Self-Appraisal').click()
      cy.get('textarea').type('I have achieved my goals this month.')
      cy.contains('Submit Check-in').click()

      cy.noConsoleErrors()
    })
  })

  context('Lifecycle (Onboarding Tasks)', () => {
    beforeEach(() => {
      cy.interceptGQL('GetOnboardingTasks', {
        data: {
          onboardingTasks: [
            { id: 't1', title: 'Sign Contract', status: 'PENDING' },
            { id: 't2', title: 'IT Setup', status: 'COMPLETED' }
          ]
        }
      }).as('GetOnboardingTasks')

      cy.visit('/TaskManager')
      cy.wait('@GetOnboardingTasks')
    })

    it('renders onboarding tasks', () => {
      cy.contains('Onboarding & Tasks').should('be.visible')
      cy.contains('Sign Contract').should('be.visible')
      cy.contains('IT Setup').should('be.visible')
    })

    it('completes an onboarding task', () => {
      cy.interceptGQL('CompleteOnboardingTask', {
        data: { completeOnboardingTask: { id: 't1', status: 'COMPLETED' } }
      })

      // Assuming there's a checkbox or complete button for 'Sign Contract'
      cy.contains('Sign Contract').parent().find('button, [role="checkbox"]').click()
      cy.noConsoleErrors()
    })
  })

  context('Company Wall & Celebrations', () => {
    beforeEach(() => {
      cy.interceptGQL('GetCelebrations', {
        data: {
          upcomingCelebrations: [
            { id: 'cel1', type: 'BIRTHDAY', employeeName: 'Alice', date: '2026-06-10' }
          ]
        }
      }).as('GetCelebrations')

      cy.visit('/CompanyWall')
      cy.wait('@GetCelebrations')
    })

    it('renders company feed and celebrations widget', () => {
      cy.contains('Company Wall').should('be.visible')
      cy.contains('Celebrations').should('be.visible')
      cy.contains('Alice').should('be.visible')
      cy.contains('Birthday').should('be.visible')
    })
  })
})
