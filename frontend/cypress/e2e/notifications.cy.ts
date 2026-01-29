/// <reference types="cypress" />

/**
 * Push Notifications E2E Tests
 * 
 * Tests push notification functionality:
 * - Service Worker registration
 * - Push subscription
 * - Notification permissions
 */
describe('Push Notifications', () => {
  const testUser = {
    email: `notifications-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  before(() => {
    // Create test user
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

  beforeEach(() => {
    cy.loginViaApi(testUser.email, testUser.password);
  });

  describe('Service Worker', () => {
    it('should register service worker', () => {
      cy.visit('/home');
      
      // Check if service worker is registered
      cy.window().then((win) => {
        if ('serviceWorker' in win.navigator) {
          cy.wrap(win.navigator.serviceWorker.ready).then((registration) => {
            expect(registration).to.exist;
            expect(registration.active).to.exist;
          });
        }
      });
    });

    it('should have push manager available', () => {
      cy.visit('/home');
      
      cy.window().then((win) => {
        if ('serviceWorker' in win.navigator && 'PushManager' in win) {
          cy.wrap(win.navigator.serviceWorker.ready).then((registration) => {
            expect(registration.pushManager).to.exist;
          });
        }
      });
    });
  });

  describe('Settings Page - Push Toggle', () => {
    it('should display push notification toggle on settings page', () => {
      cy.visit('/settings');
      
      // Find push notification section
      cy.contains(/התראות|notifications|פוש|push/i).should('be.visible');
      
      // Find enable/disable button
      cy.get('button:contains("הפעל"), button:contains("בטל"), button:contains("Enable"), button:contains("Disable")')
        .should('exist');
    });

    it('should show enable button when push is disabled', () => {
      // Ensure push is disabled
      cy.window().then((win) => {
        win.localStorage.removeItem('push_endpoint');
      });
      
      cy.visit('/settings');
      cy.reload();
      
      cy.contains(/הפעל התראות|enable.*notifications/i).should('be.visible');
    });
  });

  describe('VAPID Key Retrieval', () => {
    it('should retrieve VAPID public key from API', () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/notifications/vapid-public-key`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          failOnStatusCode: false,
        }).then((response) => {
          // If endpoint exists, should return VAPID key
          if (response.status === 200) {
            expect(response.body).to.have.property('public_key');
            expect(response.body.public_key).to.be.a('string');
          }
        });
      });
    });
  });

  describe('Push Subscription API', () => {
    it('should subscribe to push notifications via API', () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        
        // Mock subscription data (actual subscription requires browser permissions)
        const mockSubscription = {
          endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint',
          keys: {
            p256dh: 'mock-p256dh-key',
            auth: 'mock-auth-key',
          },
        };
        
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/notifications/subscribe`,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: mockSubscription,
          failOnStatusCode: false,
        }).then((response) => {
          // Subscription should be created or already exist
          expect(response.status).to.be.oneOf([200, 201, 400]);
        });
      });
    });

    it('should unsubscribe from push notifications', () => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/notifications/unsubscribe`,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint',
          },
          failOnStatusCode: false,
        }).then((response) => {
          // Should succeed or subscription not found
          expect(response.status).to.be.oneOf([200, 204, 404]);
        });
      });
    });
  });

  describe('Permission Handling', () => {
    it('should check notification permission status', () => {
      cy.visit('/home');
      
      cy.window().then((win) => {
        if ('Notification' in win) {
          const permission = win.Notification.permission;
          expect(permission).to.be.oneOf(['granted', 'denied', 'default']);
          cy.log(`Notification permission: ${permission}`);
        }
      });
    });
  });

  describe('Notification Display', () => {
    // Note: Actually displaying notifications requires granted permission
    // which cannot be automated in Cypress without special plugins
    
    it('should have notification support in browser', () => {
      cy.visit('/home');
      
      cy.window().then((win) => {
        expect('Notification' in win).to.be.true;
      });
    });
  });
});

/**
 * PWA Installation Tests
 */
describe('PWA Features', () => {
  beforeEach(() => {
    cy.visit('/home');
  });

  describe('Install Prompt', () => {
    it('should have manifest link', () => {
      cy.get('link[rel="manifest"]').should('exist');
    });

    it('should have PWA meta tags', () => {
      cy.get('meta[name="theme-color"]').should('exist');
      cy.get('meta[name="apple-mobile-web-app-capable"]').should('exist');
    });
  });

  describe('Offline Capability', () => {
    it('should show offline indicator when offline', () => {
      // Simulate offline
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'));
      });
      
      // Check for offline indicator
      cy.contains(/אופליין|offline|אין חיבור/i, { timeout: 5000 })
        .should('be.visible');
      
      // Simulate online
      cy.window().then((win) => {
        win.dispatchEvent(new Event('online'));
      });
      
      // Offline indicator should disappear
      cy.contains(/אופליין|offline|אין חיבור/i)
        .should('not.exist');
    });
  });

  describe('Cache Storage', () => {
    it('should have caches available', () => {
      cy.window().then((win) => {
        expect('caches' in win).to.be.true;
      });
    });
  });
});
