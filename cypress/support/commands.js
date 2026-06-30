// ***********************************************
// cypress/support/commands.js
// Custom commands for Tradevu HR test suite
// ***********************************************

/**
 * Login via GraphQL API and store the token in localStorage.
 * Bypasses the UI login for speed in non-auth tests.
 * Usage: cy.loginByApi('email', 'password')
 */
Cypress.Commands.add('loginByApi', (email, password) => {
  // Mock login: bypassing the network request for speed in mocked E2E tests
  const token = 'mock-jwt-token'
  const user = {
    id: '1',
    email: email || 'superadmin@tradevu.com',
    role: 'SUPER_ADMIN',
    organizationId: 'org1',
    employeeId: 'emp1',
    isOrgOwner: true
  }

  // Set localStorage reliably before app code runs on the next visit
  cy.on('window:before:load', (win) => {
    win.localStorage.setItem('token', token)
    win.localStorage.setItem('currentUser', JSON.stringify(user))
    win.localStorage.setItem('tradevu_view_mode', 'ADMIN')
  })
  
  // Intercept the Me query that AuthContext calls on app mount
  cy.interceptGQL('Me', {
    data: {
      me: user
    }
  })
  
  // Intercept layout queries to prevent hanging if backend is down
  cy.interceptGQL('GetOrg', {
    data: {
      organization: { id: 'org1', name: 'TradeVu HR' }
    }
  })

  cy.interceptGQL('GetPendingCounts', {
    data: {
      employees: [],
      documents: [],
      leaveRequests: [],
      profileUpdateRequests: [],
      allProbationRequests: [],
      allOffboardings: []
    }
  })
  
  Cypress.env('token', token)
  Cypress.env('currentUser', user)
})

/**
 * Login through the UI login page.
 * Usage: cy.loginByUI('email', 'password')
 */
Cypress.Commands.add('loginByUI', (email, password) => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').clear().type(email)
  cy.get('[data-testid="password-input"]').clear().type(password)
  cy.get('[data-testid="login-submit"]').click()
  cy.url().should('not.include', '/login')
})

/**
 * Logout the current user.
 * Usage: cy.logout()
 */
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token')
  window.localStorage.removeItem('currentUser')
})

/**
 * Make a GraphQL request using the stored auth token.
 * Usage: cy.gql(query, variables)
 */
Cypress.Commands.add('gql', (query, variables = {}) => {
  return cy.request({
    method: 'POST',
    url: Cypress.env('graphqlUrl'),
    headers: {
      Authorization: `Bearer ${Cypress.env('token')}`,
      'Content-Type': 'application/json',
    },
    body: { query, variables },
  })
})

/**
 * Navigate to a page by name (uses the app's URL patterns).
 * Usage: cy.navigateTo('Employees')
 */
Cypress.Commands.add('navigateTo', (pageName) => {
  const routes = {
    Dashboard: '/',
    Employees: '/Employees',
    Payroll: '/Payroll',
    Loans: '/Loans',
    Expenses: '/Expenses',
    Leave: '/AllLeaveRequests',
    Attendance: '/Attendance',
    Training: '/Training',
    Performance: '/Performance',
    Settings: '/Settings',
    Login: '/Login',
  }
  cy.visit(routes[pageName] || '/')
})

/**
 * Assert no console errors are present.
 * Usage: cy.noConsoleErrors()
 */
Cypress.Commands.add('noConsoleErrors', () => {
  cy.window().then((win) => {
    expect(win.consoleError).to.be.undefined
  })
})

/**
 * Intercept GraphQL operations by operation name.
 * Usage: cy.interceptGQL('GetEmployees', { data: { employees: [] } })
 */
Cypress.Commands.add('interceptGQL', (operationName, responseOverride) => {
  cy.intercept('POST', '**/graphql', (req) => {
    let matches = false;
    if (req.body && req.body.operationName) {
      matches = req.body.operationName === operationName;
    } else if (req.body && req.body.query) {
      // For queries without operationName (e.g. just query { leaveTypes { ... } })
      // We extract the first word after query or mutation
      const queryMatch = req.body.query.match(/(?:query|mutation)\s+([a-zA-Z0-9_]+)/);
      if (queryMatch && queryMatch[1]) {
        matches = queryMatch[1] === operationName;
      } else {
        // Fallback for unnamed queries like query { employees { id } }
        matches = req.body.query.includes(operationName);
      }
    } else if (typeof req.body === 'string') {
      matches = req.body.includes(operationName);
    }

    if (matches) {
      req.alias = operationName;
      req.reply({
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST, GET, OPTIONS',
          'access-control-allow-headers': 'Content-Type, Authorization',
        },
        body: responseOverride
      });
    }
  })
})

/**
 * Simulate a logged-in CEO (SUPER_ADMIN) session.
 * Sets localStorage token and intercepts the Me query.
 * Usage: cy.loginAsCEO()
 */
Cypress.Commands.add('loginAsCEO', () => {
  const token = 'test-ceo-token';
  const user = {
    id: 'ceo-1',
    email: 'ceo@tradevu.com',
    role: 'SUPER_ADMIN',
    organizationId: 'org-1',
    mustCompleteProfile: false,
    employee: null,
  };

  cy.on('window:before:load', (win) => {
    win.localStorage.setItem('token', token);
    win.localStorage.setItem('tradevu_view_mode', 'ADMIN');
  });

  cy.interceptGQL('Me', { data: { me: user } });
  Cypress.env('currentUser', user);
});

/**
 * Simulate a logged-in HR Admin session.
 * Sets localStorage token and intercepts the Me query.
 * Usage: cy.loginAsHR()
 * Usage (with profile gate): cy.loginAsHR({ mustCompleteProfile: true })
 */
Cypress.Commands.add('loginAsHR', (overrides = {}) => {
  const token = 'test-hr-token';
  const user = {
    id: 'hr-1',
    email: 'hr@tradevu.com',
    role: 'HR_ADMIN',
    organizationId: 'org-1',
    mustCompleteProfile: overrides.mustCompleteProfile ?? false,
    employee: { id: 'emp-hr-1' },
    ...overrides,
  };

  cy.on('window:before:load', (win) => {
    win.localStorage.setItem('token', token);
    win.localStorage.setItem('tradevu_view_mode', 'ADMIN');
  });

  cy.interceptGQL('Me', { data: { me: user } });
  Cypress.env('currentUser', user);
});
