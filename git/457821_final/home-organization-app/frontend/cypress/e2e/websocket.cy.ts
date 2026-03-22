/// <reference types="cypress" />

/**
 * WebSocket Real-time Updates E2E Tests
 * 
 * Tests WebSocket functionality:
 * - Connection establishment
 * - Authentication via token
 * - Receiving updates
 * - UI synchronization
 */
describe('WebSocket Real-time Updates', () => {
  const testUser = {
    email: `ws-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };
  let roomId: number;
  let token: string;

  before(() => {
    // Create test user and room
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/auth/register`,
      body: {
        email: testUser.email,
        password: testUser.password,
      },
      failOnStatusCode: false,
    });
    
    cy.loginViaApi(testUser.email, testUser.password).then((t) => {
      token = t;
      cy.createRoom(`WS Test Room ${Date.now()}`).then((id) => {
        roomId = id;
      });
    });
  });

  beforeEach(() => {
    cy.loginViaApi(testUser.email, testUser.password);
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection with valid token', () => {
      cy.visit(`/room/${roomId}`);
      
      cy.setupWebSocket().then((ws) => {
        expect(ws).to.not.be.null;
        expect(ws.readyState).to.equal(WebSocket.OPEN);
      });
    });

    it('should fail connection with invalid token', () => {
      cy.window().then((win) => {
        // Set invalid token
        win.localStorage.setItem('token', 'invalid-token');
        
        const wsUrl = 'ws://localhost:8000/ws?token=invalid-token';
        const ws = new WebSocket(wsUrl);
        
        // Connection should fail
        cy.wrap(new Promise((resolve) => {
          ws.onerror = () => resolve('error');
          ws.onclose = () => resolve('closed');
          setTimeout(() => resolve('timeout'), 5000);
        })).should('be.oneOf', ['error', 'closed']);
      });
    });

    it('should reconnect after disconnection', () => {
      cy.visit(`/room/${roomId}`);
      
      cy.setupWebSocket().then((ws) => {
        // Close the connection
        ws.close();
        
        // Wait a moment
        cy.wait(1000);
        
        // Reconnect
        cy.setupWebSocket().then((newWs) => {
          expect(newWs.readyState).to.equal(WebSocket.OPEN);
        });
      });
    });
  });

  describe('Real-time Task Updates', () => {
    it('should receive update when task is created', () => {
      cy.visit(`/room/${roomId}`);
      cy.setupWebSocket();
      
      const taskTitle = `WS Task Create ${Date.now()}`;
      
      // Create task via API
      cy.createTask(roomId, taskTitle);
      
      // Wait for WebSocket message or UI update
      cy.contains(taskTitle, { timeout: 10000 }).should('be.visible');
    });

    it('should receive update when task is completed', () => {
      const taskTitle = `WS Task Complete ${Date.now()}`;
      
      cy.createTask(roomId, taskTitle).then((taskId) => {
        cy.visit(`/room/${roomId}`);
        cy.setupWebSocket();
        
        // Complete task via API
        cy.window().then((win) => {
          const t = win.localStorage.getItem('token');
          cy.request({
            method: 'PUT',
            url: `${Cypress.env('apiUrl')}/api/tasks/${taskId}/complete`,
            headers: { Authorization: `Bearer ${t}` },
          });
        });
        
        // Task should show as completed
        cy.contains(taskTitle, { timeout: 10000 })
          .should('have.css', 'text-decoration')
          .and('match', /line-through/);
      });
    });

    it('should receive update when task is deleted', () => {
      const taskTitle = `WS Task Delete ${Date.now()}`;
      
      cy.createTask(roomId, taskTitle).then((taskId) => {
        cy.visit(`/room/${roomId}`);
        cy.setupWebSocket();
        
        // Verify task exists
        cy.contains(taskTitle).should('be.visible');
        
        // Delete task via API
        cy.window().then((win) => {
          const t = win.localStorage.getItem('token');
          cy.request({
            method: 'DELETE',
            url: `${Cypress.env('apiUrl')}/api/tasks/${taskId}`,
            headers: { Authorization: `Bearer ${t}` },
          });
        });
        
        // Task should be removed
        cy.contains(taskTitle, { timeout: 10000 }).should('not.exist');
      });
    });
  });

  describe('Real-time Room Updates', () => {
    it('should update room progress in real-time', () => {
      const newRoomName = `Progress WS Room ${Date.now()}`;
      
      cy.createRoom(newRoomName).then((newRoomId) => {
        // Create tasks
        cy.createTask(newRoomId, 'Task 1');
        cy.createTask(newRoomId, 'Task 2').then((task2Id) => {
          cy.visit('/home');
          cy.setupWebSocket();
          
          // Verify initial progress (0%)
          cy.contains(newRoomName)
            .parents('[class*="card"], a')
            .contains(/0%/).should('be.visible');
          
          // Complete task via API
          cy.window().then((win) => {
            const t = win.localStorage.getItem('token');
            cy.request({
              method: 'PUT',
              url: `${Cypress.env('apiUrl')}/api/tasks/${task2Id}/complete`,
              headers: { Authorization: `Bearer ${t}` },
            });
          });
          
          // Progress should update to 50%
          cy.contains(newRoomName, { timeout: 10000 })
            .parents('[class*="card"], a')
            .contains(/50%/).should('be.visible');
        });
      });
    });
  });

  describe('Multi-device Simulation', () => {
    it('should sync changes made by another "device"', () => {
      const taskTitle = `Multi-device Task ${Date.now()}`;
      
      cy.createTask(roomId, taskTitle).then((taskId) => {
        cy.visit(`/room/${roomId}`);
        cy.setupWebSocket();
        
        // Simulate another device completing the task
        // (This would normally be another browser/session)
        cy.request({
          method: 'PUT',
          url: `${Cypress.env('apiUrl')}/api/tasks/${taskId}/complete`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Current view should update
        cy.contains(taskTitle, { timeout: 10000 })
          .should('have.css', 'text-decoration')
          .and('match', /line-through/);
      });
    });
  });

  describe('Connection Error Handling', () => {
    it('should show offline indicator when connection lost', () => {
      cy.visit(`/room/${roomId}`);
      
      // Simulate going offline
      cy.window().then((win) => {
        // Dispatch offline event
        win.dispatchEvent(new Event('offline'));
      });
      
      // Should show offline indicator
      cy.contains(/אופליין|offline|אין חיבור/i, { timeout: 5000 })
        .should('be.visible');
      
      // Simulate coming back online
      cy.window().then((win) => {
        win.dispatchEvent(new Event('online'));
      });
      
      // Offline indicator should disappear
      cy.contains(/אופליין|offline|אין חיבור/i)
        .should('not.exist');
    });
  });
});
