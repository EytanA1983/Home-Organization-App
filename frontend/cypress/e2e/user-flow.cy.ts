/// <reference types="cypress" />

/**
 * Complete User Flow E2E Test
 * 
 * Tests the full flow:
 * 1. Register new user
 * 2. Login
 * 3. Create room
 * 4. Add task
 * 5. Add todo
 * 6. Complete todo
 * 7. Receive WebSocket update
 * 8. Verify real-time UI update
 */
describe('Complete User Flow', () => {
  const timestamp = Date.now();
  const testUser = {
    email: `flow-test-${timestamp}@example.com`,
    password: 'TestPassword123!',
  };
  const roomName = `חדר סלון ${timestamp}`;
  const taskTitle = `לנקות את החדר ${timestamp}`;
  const todoTitle = 'לשטוף את הרצפה';

  let roomId: number;
  let taskId: number;
  let todoId: number;

  describe('User Registration and Login Flow', () => {
    it('Step 1: Should register a new user', () => {
      cy.visit('/register');
      
      // Fill registration form
      cy.get('input[type="email"], input[name="email"]')
        .should('be.visible')
        .type(testUser.email);
        
      cy.get('input[type="password"], input[name="password"]')
        .should('be.visible')
        .type(testUser.password);
        
      cy.get('button[type="submit"]').click();
      
      // Wait for registration to complete
      cy.wait('@apiPost');
      
      // Should redirect after successful registration
      cy.url().should('not.include', '/register');
    });

    it('Step 2: Should login with new user credentials', () => {
      cy.login(testUser.email, testUser.password);
      
      // Verify login success
      cy.url().should('include', '/home');
      cy.window().its('localStorage.token').should('exist');
      
      // Verify navbar shows authenticated state
      cy.contains(/התנתק|logout/i).should('be.visible');
    });
  });

  describe('Room and Task Creation Flow', () => {
    beforeEach(() => {
      cy.loginViaApi(testUser.email, testUser.password);
    });

    it('Step 3: Should create a new room', () => {
      cy.visit('/home');
      
      // Click add room
      cy.contains(/הוסף חדר|add room|חדש/i).click();
      
      // Fill room name
      cy.get('input[name="name"], input[placeholder*="שם"]')
        .should('be.visible')
        .type(roomName);
      
      // Submit
      cy.get('button[type="submit"], button:contains("שמור"), button:contains("צור")')
        .click();
      
      // Wait for API response
      cy.wait('@apiPost').then((interception) => {
        if (interception.response?.body?.id) {
          roomId = interception.response.body.id;
        }
      });
      
      // Verify room appears
      cy.contains(roomName).should('be.visible');
      
      // Verify room has correct emoji (סלון = 🛋️)
      cy.contains(roomName)
        .parents('[class*="card"], a')
        .should('contain', '🛋️');
    });

    it('Step 4: Should navigate to room and create a task', () => {
      // If roomId wasn't captured, create via API
      if (!roomId) {
        cy.createRoom(roomName).then((id) => {
          roomId = id;
        });
      }
      
      cy.visit(`/room/${roomId}`);
      
      // Verify we're on the room page
      cy.contains(roomName).should('be.visible');
      
      // Add new task
      cy.contains(/הוסף משימה|add task|משימה חדשה/i).click();
      
      cy.get('input[name="title"], input[placeholder*="כותרת"], input[placeholder*="משימה"]')
        .should('be.visible')
        .type(taskTitle);
      
      cy.get('button[type="submit"], button:contains("שמור"), button:contains("צור")')
        .click();
      
      // Wait for API response
      cy.wait('@apiPost').then((interception) => {
        if (interception.response?.body?.id) {
          taskId = interception.response.body.id;
        }
      });
      
      // Verify task appears
      cy.contains(taskTitle).should('be.visible');
    });

    it('Step 5: Should add a todo (sub-task) to the task', () => {
      // Ensure we have taskId
      if (!taskId) {
        cy.createTask(roomId, taskTitle).then((id) => {
          taskId = id;
        });
      }
      
      cy.visit(`/room/${roomId}`);
      
      // Find task and add todo
      cy.contains(taskTitle)
        .parents('[class*="task"], [class*="card"]')
        .within(() => {
          // Look for add todo button or input
          cy.get('button:contains("+"), button[aria-label*="הוסף"], input[placeholder*="תת-משימה"]')
            .first()
            .click();
        });
      
      // If there's a modal or inline input
      cy.get('body').then(($body) => {
        if ($body.find('input[name="todo"], input[placeholder*="תת-משימה"]').length > 0) {
          cy.get('input[name="todo"], input[placeholder*="תת-משימה"]')
            .type(todoTitle)
            .type('{enter}');
        }
      });
      
      // Verify todo appears
      cy.contains(todoTitle).should('be.visible');
    });
  });

  describe('Real-time Updates via WebSocket', () => {
    beforeEach(() => {
      cy.loginViaApi(testUser.email, testUser.password);
    });

    it('Step 6: Should setup WebSocket connection', () => {
      cy.visit(`/room/${roomId}`);
      
      // Setup WebSocket
      cy.setupWebSocket().then((ws) => {
        expect(ws.readyState).to.equal(WebSocket.OPEN);
      });
    });

    it('Step 7: Should receive WebSocket update when task is completed', () => {
      // If we don't have IDs, create fresh data
      if (!roomId || !taskId) {
        cy.createRoom(`WS Test Room ${Date.now()}`).then((rId) => {
          roomId = rId;
          cy.createTask(roomId, `WS Test Task ${Date.now()}`).then((tId) => {
            taskId = tId;
          });
        });
      }
      
      cy.visit(`/room/${roomId}`);
      
      // Setup WebSocket listener
      cy.setupWebSocket();
      
      // Complete the task (this should trigger WS message)
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        
        cy.request({
          method: 'PUT',
          url: `${Cypress.env('apiUrl')}/api/tasks/${taskId}/complete`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      });
      
      // Wait for WebSocket message
      cy.waitForWsMessage(5000).then((message) => {
        // Verify message contains expected data
        expect(message).to.have.property('type');
        cy.log('Received WebSocket message:', JSON.stringify(message));
      });
    });

    it('Step 8: Should update UI in real-time after WebSocket message', () => {
      const realtimeTaskTitle = `Realtime Task ${Date.now()}`;
      
      cy.createTask(roomId, realtimeTaskTitle).then((newTaskId) => {
        cy.visit(`/room/${roomId}`);
        
        // Verify task is not completed
        cy.contains(realtimeTaskTitle)
          .should('be.visible')
          .should('not.have.css', 'text-decoration', 'line-through');
        
        // Complete task via API (simulating another user/device)
        cy.window().then((win) => {
          const token = win.localStorage.getItem('token');
          
          cy.request({
            method: 'PUT',
            url: `${Cypress.env('apiUrl')}/api/tasks/${newTaskId}/complete`,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        });
        
        // UI should update (either via WS or polling)
        cy.contains(realtimeTaskTitle, { timeout: 10000 })
          .should('have.css', 'text-decoration')
          .and('match', /line-through/);
      });
    });
  });

  describe('Progress and Completion Flow', () => {
    beforeEach(() => {
      cy.loginViaApi(testUser.email, testUser.password);
    });

    it('Should show correct progress percentage', () => {
      // Create room with known tasks
      const progressRoomName = `Progress Room ${Date.now()}`;
      
      cy.createRoom(progressRoomName).then((pRoomId) => {
        // Create 4 tasks, complete 2
        cy.createTask(pRoomId, 'Task 1').then((t1) => {
          cy.window().then((win) => {
            const token = win.localStorage.getItem('token');
            cy.request({
              method: 'PUT',
              url: `${Cypress.env('apiUrl')}/api/tasks/${t1}/complete`,
              headers: { Authorization: `Bearer ${token}` },
            });
          });
        });
        cy.createTask(pRoomId, 'Task 2').then((t2) => {
          cy.window().then((win) => {
            const token = win.localStorage.getItem('token');
            cy.request({
              method: 'PUT',
              url: `${Cypress.env('apiUrl')}/api/tasks/${t2}/complete`,
              headers: { Authorization: `Bearer ${token}` },
            });
          });
        });
        cy.createTask(pRoomId, 'Task 3');
        cy.createTask(pRoomId, 'Task 4');
        
        // Check progress shows 50%
        cy.visit('/home');
        cy.contains(progressRoomName)
          .parents('[class*="card"], a')
          .contains(/50%/).should('be.visible');
      });
    });

    it('Should show celebration when room is 100% complete', () => {
      const completeRoomName = `Complete Room ${Date.now()}`;
      
      cy.createRoom(completeRoomName).then((cRoomId) => {
        cy.createTask(cRoomId, 'Only Task').then((tId) => {
          cy.window().then((win) => {
            const token = win.localStorage.getItem('token');
            cy.request({
              method: 'PUT',
              url: `${Cypress.env('apiUrl')}/api/tasks/${tId}/complete`,
              headers: { Authorization: `Bearer ${token}` },
            });
          });
          
          cy.visit('/home');
          
          // Should show 100% or celebration indicator
          cy.contains(completeRoomName)
            .parents('[class*="card"], a')
            .should('satisfy', ($el) => {
              const text = $el.text();
              return text.includes('100%') || 
                     text.includes('הושלם') || 
                     text.includes('🎉') ||
                     text.includes('✅');
            });
        });
      });
    });
  });

  describe('Cleanup', () => {
    it('Should logout at end of flow', () => {
      cy.loginViaApi(testUser.email, testUser.password);
      cy.visit('/home');
      cy.logout();
      
      cy.url().should('include', '/login');
    });
  });
});
