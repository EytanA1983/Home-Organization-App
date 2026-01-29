/// <reference types="cypress" />

describe('Authentication', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
  };

  describe('Registration', () => {
    it('should display registration form', () => {
      cy.visit('/register');
      
      cy.get('input[type="email"], input[name="email"]').should('be.visible');
      cy.get('input[type="password"], input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.visit('/register');
      
      cy.get('button[type="submit"]').click();
      
      // Should show validation messages
      cy.get('input:invalid').should('exist');
    });

    it('should register a new user successfully', () => {
      cy.visit('/register');
      
      cy.get('input[type="email"], input[name="email"]').type(testUser.email);
      cy.get('input[type="password"], input[name="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
      
      // Should redirect after successful registration
      cy.url().should('not.include', '/register');
    });

    it('should show error for duplicate email', () => {
      // First register
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/api/auth/register`,
        body: {
          email: testUser.email,
          password: testUser.password,
        },
        failOnStatusCode: false,
      });
      
      // Try to register again with same email
      cy.visit('/register');
      cy.get('input[type="email"], input[name="email"]').type(testUser.email);
      cy.get('input[type="password"], input[name="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
      
      // Should show error message
      cy.contains(/כבר קיים|already exists|שגיאה/i).should('be.visible');
    });
  });

  describe('Login', () => {
    before(() => {
      // Create test user via API
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/api/auth/register`,
        body: {
          email: testUser.email,
          password: testUser.password,
        },
        failOnStatusCode: false,
      });
    });

    it('should display login form', () => {
      cy.visit('/login');
      
      cy.get('input[type="email"], input[name="email"]').should('be.visible');
      cy.get('input[type="password"], input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      
      cy.get('input[type="email"], input[name="email"]').type('wrong@example.com');
      cy.get('input[type="password"], input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      // Should show error message
      cy.contains(/שגיאה|incorrect|invalid/i).should('be.visible');
    });

    it('should login successfully with valid credentials', () => {
      cy.login(testUser.email, testUser.password);
      
      // Verify we're on home page
      cy.url().should('include', '/home');
      
      // Verify navbar shows authenticated state
      cy.contains(/התנתק|logout/i).should('be.visible');
    });

    it('should persist login across page refresh', () => {
      cy.loginViaApi(testUser.email, testUser.password);
      
      cy.visit('/home');
      cy.reload();
      
      // Should still be logged in
      cy.url().should('include', '/home');
      cy.contains(/התנתק|logout/i).should('be.visible');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      cy.loginViaApi(testUser.email, testUser.password);
      cy.visit('/home');
    });

    it('should logout successfully', () => {
      cy.logout();
      
      // Verify redirect to login
      cy.url().should('include', '/login');
      
      // Verify token is removed
      cy.window().its('localStorage.token').should('not.exist');
    });

    it('should require login to access protected routes after logout', () => {
      cy.logout();
      
      // Try to access home page
      cy.visit('/home');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/home');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });

    it('should allow access to protected routes when authenticated', () => {
      cy.loginViaApi(testUser.email, testUser.password);
      
      cy.visit('/home');
      
      // Should stay on home page
      cy.url().should('include', '/home');
    });
  });
});
