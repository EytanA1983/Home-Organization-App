/// <reference types="cypress" />

// Import commands
import './commands';

// Global before each
beforeEach(() => {
  // Clear localStorage before each test
  cy.clearLocalStorage();
  
  // Intercept API calls for monitoring
  cy.intercept('GET', '/api/**').as('apiGet');
  cy.intercept('POST', '/api/**').as('apiPost');
  cy.intercept('PUT', '/api/**').as('apiPut');
  cy.intercept('DELETE', '/api/**').as('apiDelete');
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on uncaught exceptions from the app
  // unless they're critical
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});

// Log failed commands for debugging
Cypress.on('fail', (error, runnable) => {
  // Log the error details
  console.error('Test failed:', {
    test: runnable.title,
    error: error.message,
  });
  throw error;
});
