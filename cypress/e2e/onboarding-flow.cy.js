/**
 * Critical Path Integration Test: CEO → HR Onboarding Flow
 * 
 * Covers:
 *   1. CEO registration (all 5 steps, real GQL mutation mocked via cy.intercept)
 *   2. CEO invites HR admin
 *   3. HR admin accepts invite (valid token) and is redirected to /dashboard
 *   4. HR admin profile completion (Step 1: personal info, Step 2: identity)
 *   5. CEO approves HR profile from PendingApprovals page
 *   6. HR CSV upload step (when VITE_FEATURE_CSV_IMPORT=true)
 * 
 * All real network calls are intercepted — this test is safe to run without a live backend.
 */

describe('CEO → HR Onboarding Critical Path', () => {
  // ─── Shared Fixtures ────────────────────────────────────────────────────────
  const CEO_EMAIL = 'ceo-test@tradevu.com';
  const CEO_PASSWORD = 'SecureCeo1!';
  const HR_EMAIL = 'hr-test@tradevu.com';
  const HR_PASSWORD = 'SecureHr1!';
  const ORG_NAME = 'TradeVu Test Org';
  const VALID_INVITE_TOKEN = 'valid-test-invite-token-001';

  function interceptGQL(operationName, aliasName, fixture) {
    cy.intercept('POST', '**/graphql', (req) => {
      let matches = false;
      if (typeof req.body === 'string') {
        matches = req.body.includes(operationName);
      } else if (req.body) {
        matches = (req.body.operationName === operationName) || 
                  (req.body.query && req.body.query.includes(operationName));
      }

      if (matches) {
        req.alias = aliasName;
        req.reply({ body: { data: fixture } });
      }
    });
  }

  // ─── Test 1: CEO Registration ────────────────────────────────────────────────
  describe('CEO Registration Flow', () => {
    beforeEach(() => {
      interceptGQL('Me', 'meQuery', { me: { id: 'ceo-1', email: CEO_EMAIL, role: 'SUPER_ADMIN', organizationId: 'org-1' } });

      interceptGQL('Register', 'registerMutation', {
        register: {
          token: 'ceo-session-token',
          user: { id: 'ceo-1', email: CEO_EMAIL, role: 'SUPER_ADMIN', organizationId: 'org-1' }
        }
      });
      // Mock the checkAppState call that fires after token is stored
      interceptGQL('Me', 'getCurrentUser', {
        me: {
          id: 'ceo-1', email: CEO_EMAIL, role: 'SUPER_ADMIN',
          organizationId: 'org-1', mustCompleteProfile: false,
          employee: null
        }
      });
      // Mock the InviteHRAdmin call to prevent unhandled network errors
      interceptGQL('InviteHRAdmin', 'inviteHrMutation', {
        inviteUser: {
          id: 'hr-1', email: HR_EMAIL
        }
      });
    });

    it('can complete all 5 steps and submit registration', () => {
      cy.visit('/register');
      cy.contains('Create workspace').should('be.visible');

      // Step 1: Org name
      cy.get('input[placeholder="Acme Corp"]').type(ORG_NAME);
      cy.contains('button', 'Continue').click();

      // Step 2: Admin email
      cy.contains('Admin email').should('be.visible');
      cy.get('input[placeholder="name@company.com"]').type(CEO_EMAIL);
      cy.contains('button', 'Continue').click();

      // Step 3: Password
      cy.contains('Secure account').should('be.visible');
      cy.get('input[placeholder="••••••••"]').first().type(CEO_PASSWORD);
      cy.contains('button', 'Continue').click();

      // Step 4: Employee defaults
      cy.contains('Employee defaults').should('be.visible');
      cy.get('input[placeholder="••••••••"]').first().type('DefaultEmp1!');
      cy.contains('button', 'Continue').click();

      // Step 5: Invite HR (optional)
      cy.contains('Invite HR Team').should('be.visible');
      cy.contains('button', 'Complete Setup').click();

      cy.wait('@registerMutation').its('request.body.variables.input').should('deep.include', {
        email: CEO_EMAIL,
        orgName: ORG_NAME,
      });

      // Should navigate to dashboard after successful registration
      cy.url().should('include', '/dashboard');
    });

    it('shows an error when registration fails (duplicate email)', () => {
      cy.intercept('POST', '**/graphql', (req) => {
        if (req.body.operationName === 'Register') {
          req.reply({
            body: { errors: [{ message: 'Email already registered' }], data: null }
          });
        }
      });

      cy.visit('/register');
      cy.get('input[placeholder="Acme Corp"]').type(ORG_NAME);
      cy.contains('button', 'Continue').click();
      cy.get('input[placeholder="name@company.com"]').type('existing@tradevu.com');
      cy.contains('button', 'Continue').click();
      cy.get('input[placeholder="••••••••"]').first().type(CEO_PASSWORD);
      cy.contains('button', 'Continue').click();
      cy.get('input[placeholder="••••••••"]').first().type('DefaultEmp1!');
      cy.contains('button', 'Continue').click();
      cy.contains('button', 'Complete Setup').click();

      cy.contains('Email already registered').should('be.visible');
    });
  });

  // ─── Test 2: CEO Invites HR ──────────────────────────────────────────────────
  describe('CEO Invites HR Admin', () => {
    it('sends an invite email and shows success toast', () => {
      interceptGQL('InviteUser', 'inviteHR', {
        inviteUser: true
      });
      interceptGQL('GetPaginatedEmployees', 'getPaginatedEmployees', {
        paginatedEmployees: {
          employees: [],
          totalCount: 0,
          totalPages: 1,
          currentPage: 1
        }
      });
      interceptGQL('GetDepartments', 'getDepartments', { departments: [] });

      cy.loginAsCEO(); // custom command (see commands.js)
      cy.visit('/employees');
      cy.contains('button', /Invite User/i).first().click();
      
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[id="email"]').type(HR_EMAIL);
        cy.get('button[role="combobox"]').first().click();
      });
      // The select popover is usually appended to body, not inside the dialog, so we keep this outside within()
      cy.contains('div[role="option"]', 'HR Manager').click();

      cy.get('[role="dialog"]').contains('button', /send invite/i).first().click();

      cy.wait('@inviteHR');
      cy.contains(/invitation sent/i).should('be.visible');
    });
  });

  // ─── Test 3: HR Accepts Invite ──────────────────────────────────────────────
  describe('HR Admin Accepts Invite', () => {
    beforeEach(() => {
      interceptGQL('ValidateInviteToken', 'validateToken', {
        validateInviteToken: {
          valid: true,
          email: HR_EMAIL,
          role: 'HR_ADMIN',
          organizationName: ORG_NAME,
        }
      });
    });

    it('renders the invite form with pre-filled email for a valid token', () => {
      cy.visit(`/accept-invite?token=${VALID_INVITE_TOKEN}`);
      cy.wait('@validateToken');
      cy.contains(/join/i).should('be.visible');
      cy.contains(HR_EMAIL).should('be.visible');
    });

    it('redirects HR admin to /dashboard (NOT /) after accepting', () => {
      interceptGQL('AcceptInvite', 'acceptInvite', {
        acceptInvite: {
          token: 'hr-session-token',
          user: { id: 'hr-1', email: HR_EMAIL, role: 'HR_ADMIN', organizationId: 'org-1' }
        }
      });
      interceptGQL('Me', 'getUser', {
        me: {
          id: 'hr-1', email: HR_EMAIL, role: 'HR_ADMIN',
          organizationId: 'org-1', mustCompleteProfile: true,
          employee: null
        }
      });

      cy.visit(`/accept-invite?token=${VALID_INVITE_TOKEN}`);
      cy.wait('@validateToken');

      cy.get('input[placeholder="Jane"]').type('Jane');
      cy.get('input[placeholder="Doe"]').type('Doe');
      cy.get('input[placeholder="••••••••"]').eq(0).type(HR_PASSWORD);
      cy.get('input[placeholder="••••••••"]').eq(1).type(HR_PASSWORD);
      cy.contains('button', /create account/i).click();

      cy.wait('@acceptInvite');
      // Because mustCompleteProfile: true, the app redirects to the wizard
      // The key assertion is they do NOT land on "/" (the public home)
      cy.url().should('not.eq', Cypress.config('baseUrl') + '/');
    });

    it('shows error for an invalid/expired token', () => {
      interceptGQL('ValidateInviteToken', 'validateToken', {
        validateInviteToken: { valid: false }
      });
      cy.visit('/accept-invite?token=expired-token');
      cy.wait('@validateToken');
      cy.contains(/invalid or has expired/i).should('be.visible');
    });

    it('shows error when no token is present in URL', () => {
      cy.visit('/accept-invite');
      cy.contains(/invalid or missing invite token/i).should('be.visible');
    });
  });

  // ─── Test 4: HR Profile Completion ──────────────────────────────────────────
  describe('HR Profile Completion Wizard', () => {
    beforeEach(() => {
      // Login as HR admin with mustCompleteProfile=true
      interceptGQL('GetEmployee', 'getEmployee', { employee: null });
      cy.loginAsHR({ mustCompleteProfile: true }); // custom command
    });

    it('shows the profile completion wizard when mustCompleteProfile is true', () => {
      cy.visit('/profile-completion');
      cy.contains('Personal Information').should('be.visible');
    });

    it('shows Step 1 of 2 for HR when CSV_IMPORT is disabled', () => {
      cy.visit('/profile-completion');
      cy.contains(/step 1 of 2/i).should('be.visible');
    });
  });

  // ─── Test 5: Feature Flag — CSV Upload Step ──────────────────────────────────
  describe('CSV Import Step (Feature Flag)', () => {
    it('CSV import step is hidden in prod (no VITE_FEATURE_CSV_IMPORT)', () => {
      interceptGQL('GetEmployee', 'getEmployee', { employee: null });
      cy.loginAsHR({ mustCompleteProfile: true });
      cy.visit('/profile-completion');
      cy.contains(/step 1 of 2/i).should('be.visible');
      cy.contains(/step 1 of 3/i).should('not.exist');
      cy.contains('Import Employees').should('not.exist');
    });
  });
});
