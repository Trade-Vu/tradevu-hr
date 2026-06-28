/**
 * Cypress E2E Tests: Dashboard
 * Tests: Layout rendering, stat cards, navigation sidebar, quick actions
 */

describe('Dashboard', () => {
  beforeEach(() => {
    cy.fixture('users').then(({ superAdmin }) => {
      cy.loginByApi(superAdmin.email, superAdmin.password)
      
      cy.intercept('POST', '**/graphql', (req) => {
        if (req.body.operationName === 'GetDashboardEmployees') {
          req.reply({
            data: {
              employees: [
                { id: '1', fullName: 'Super Admin', email: 'admin@example.com', onboardingStatus: 'completed', onboardingProgress: 100 },
                { id: '2', fullName: 'User 2', email: 'user2@example.com', onboardingStatus: 'in_progress', onboardingProgress: 50 },
              ]
            }
          })
        }
        if (req.body.operationName === 'GetPaginatedDashboardEmployees') {
          const hasSearch = req.body.variables && req.body.variables.search && req.body.variables.search.length > 0;
          if (hasSearch) {
            req.reply({
              data: {
                paginatedEmployees: {
                  employees: [],
                  totalCount: 0,
                  totalPages: 1,
                  currentPage: 1
                }
              }
            })
          } else {
            req.reply({
              data: {
                paginatedEmployees: {
                  employees: [
                    { id: '1', fullName: 'Super Admin', email: 'admin@example.com' },
                    { id: '2', fullName: 'User 2', email: 'user2@example.com' },
                  ],
                  totalCount: 2,
                  totalPages: 1,
                  currentPage: 1
                }
              }
            })
          }
        }
        if (req.body.operationName === 'GetPendingCounts') {
          req.reply({
            data: {
              pendingEmployeesCount: 0,
              pendingTimeOffCount: 0,
              pendingExpensesCount: 0
            }
          })
        }
      }).as('graphql')

      cy.visit('/')
    })
  })

  context('Layout & Navigation Sidebar', () => {
    it('renders the main navigation sidebar', () => {
      cy.get('aside, [data-sidebar], nav').should('be.visible')
    })

    it('shows Tradevu branding or logo', () => {
      // The desktop sidebar has an img with alt="TradeVu"
      cy.get('img[alt="TradeVu"]').should('be.visible')
    })

    it('renders primary navigation icons', () => {
      // Primary rail should have multiple buttons/links
      cy.get('aside').first().find('button, a').should('have.length.gt', 4)
    })

    it('highlights the active navigation item in secondary sidebar', () => {
      // Active secondary nav item should have distinct styles (e.g. bg-slate-100)
      cy.get('a[href="/"]').should('have.class', 'bg-slate-100')
    })

    it('renders user info in dropdown trigger', () => {
      // User avatar button
      cy.get('aside').first().find('button').last().should('be.visible')
    })
  })

  context('Dashboard Stats', () => {
    it('renders four stat cards', () => {
      cy.get('.grid').find('[class*="Card"], .bg-white').should('have.length.gte', 4)
    })

    it('displays Total Employees stat card', () => {
      cy.contains(/total employees/i).should('be.visible')
    })

    it('displays Active Onboarding stat card', () => {
      cy.contains(/active onboarding/i).should('be.visible')
    })

    it('displays Avg. Progress stat card', () => {
      cy.contains(/avg.*progress|average/i).should('be.visible')
    })
  })

  context('Quick Actions', () => {
    it('renders quick action buttons', () => {
      cy.contains(/quick actions|add employee|new hire/i).should('be.visible')
    })

    it('Add New Hire button navigates to employees page', () => {
      cy.contains('button, a', /add new hire/i).click()
      cy.url({ timeout: 8000 }).should('include', 'employees')
    })
  })

  context('Employee List Table', () => {
    it('renders the employee list section', () => {
      cy.contains(/employees/i).should('be.visible')
    })

    it('renders search input for filtering employees', () => {
      cy.get('input[placeholder*="search" i], input[placeholder*="employee" i]').should('be.visible')
    })

    it('renders status filter dropdown', () => {
      cy.get('select').should('be.visible').and('contain', 'All Status')
    })

    it('filters employees by search term', () => {
      cy.get('input[placeholder*="search" i]').type('test-nonexistent-xyz')
      cy.wait('@graphql')
      cy.contains(/No employees yet/i).should('be.visible')
    })
  })

  context('Mobile Responsiveness', () => {
    it('renders mobile header on small screens', () => {
      cy.viewport('iphone-x')
      cy.visit('/')
      cy.get('header').should('be.visible')
    })

    it('sidebar is hidden by default on mobile', () => {
      cy.viewport('iphone-x')
      cy.visit('/')
      cy.get('aside, [data-sidebar]').should('not.be.visible')
    })
  })
})
