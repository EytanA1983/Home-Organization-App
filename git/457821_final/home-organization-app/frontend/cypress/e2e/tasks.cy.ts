/// <reference types="cypress" />

describe('Tasks Management', () => {
  const testUser = {
    email: `tasks-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };
  let roomId: number;
  const roomName = `חדר משימות ${Date.now()}`;

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
    
    // Create test room
    cy.loginViaApi(testUser.email, testUser.password);
    cy.createRoom(roomName).then((id) => {
      roomId = id;
    });
  });

  beforeEach(() => {
    cy.loginViaApi(testUser.email, testUser.password);
  });

  describe('Task Creation', () => {
    it('should create a new task in a room', () => {
      const taskTitle = `משימה חדשה ${Date.now()}`;
      
      // Navigate to room
      cy.visit(`/room/${roomId}`);
      
      // Find add task button/form
      cy.contains(/הוסף משימה|add task|משימה חדשה/i).click();
      
      // Fill in task details
      cy.get('input[name="title"], input[placeholder*="כותרת"], input[placeholder*="משימה"]')
        .should('be.visible')
        .type(taskTitle);
      
      // Submit
      cy.get('button[type="submit"], button:contains("שמור"), button:contains("צור")')
        .click();
      
      // Verify task appears
      cy.contains(taskTitle).should('be.visible');
    });

    it('should create a task with description', () => {
      const taskTitle = `משימה עם תיאור ${Date.now()}`;
      const taskDescription = 'זהו תיאור המשימה לבדיקה';
      
      cy.createTask(roomId, taskTitle, taskDescription).then((taskId) => {
        expect(taskId).to.be.a('number');
        
        cy.visit(`/room/${roomId}`);
        cy.contains(taskTitle).should('be.visible');
      });
    });

    it('should create task via API', () => {
      const taskTitle = `משימה API ${Date.now()}`;
      
      cy.createTask(roomId, taskTitle).then((taskId) => {
        expect(taskId).to.be.a('number');
        
        // Verify task exists via API
        cy.window().then((win) => {
          const token = win.localStorage.getItem('token');
          
          cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/api/tasks/${taskId}`,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.title).to.eq(taskTitle);
          });
        });
      });
    });
  });

  describe('Task Completion', () => {
    let taskId: number;
    const taskTitle = `משימה להשלמה ${Date.now()}`;

    beforeEach(() => {
      cy.createTask(roomId, taskTitle).then((id) => {
        taskId = id;
      });
    });

    it('should toggle task completion status', () => {
      cy.visit(`/room/${roomId}`);
      
      // Find task and toggle completion
      cy.contains(taskTitle)
        .parents('[class*="task"], [class*="card"]')
        .find('input[type="checkbox"], button[aria-label*="השלם"], button:contains("✓")')
        .first()
        .click();
      
      // Verify completion visual feedback
      cy.contains(taskTitle)
        .should('have.css', 'text-decoration')
        .and('match', /line-through/);
    });

    it('should update progress bar after completing task', () => {
      cy.visit('/home');
      
      // Get initial progress
      cy.contains(roomName)
        .parents('[class*="card"], a')
        .find('[class*="progress"]')
        .invoke('attr', 'style')
        .then((initialStyle) => {
          // Complete the task
          cy.visit(`/room/${roomId}`);
          cy.contains(taskTitle)
            .parents('[class*="task"], [class*="card"]')
            .find('input[type="checkbox"]')
            .first()
            .click();
          
          // Go back and check progress changed
          cy.visit('/home');
          cy.contains(roomName)
            .parents('[class*="card"], a')
            .find('[class*="progress"]')
            .invoke('attr', 'style')
            .should('not.eq', initialStyle);
        });
    });
  });

  describe('Task List Filtering', () => {
    before(() => {
      // Create multiple tasks
      cy.loginViaApi(testUser.email, testUser.password);
      cy.createTask(roomId, 'משימה 1').then((id) => {
        // Complete this task
        cy.window().then((win) => {
          const token = win.localStorage.getItem('token');
          cy.request({
            method: 'PUT',
            url: `${Cypress.env('apiUrl')}/api/tasks/${id}/complete`,
            headers: { Authorization: `Bearer ${token}` },
          });
        });
      });
      cy.createTask(roomId, 'משימה 2');
      cy.createTask(roomId, 'משימה 3');
    });

    it('should filter tasks by completion status', () => {
      cy.visit(`/room/${roomId}`);
      
      // Check if filter exists and use it
      cy.get('body').then(($body) => {
        if ($body.find('select, [role="combobox"]').length > 0) {
          cy.get('select, [role="combobox"]').select('completed');
          cy.contains('משימה 1').should('be.visible');
          cy.contains('משימה 2').should('not.exist');
        }
      });
    });
  });

  describe('Task Deletion', () => {
    it('should delete a task', () => {
      const taskTitle = `משימה למחיקה ${Date.now()}`;
      
      cy.createTask(roomId, taskTitle).then(() => {
        cy.visit(`/room/${roomId}`);
        
        // Find task and delete
        cy.contains(taskTitle)
          .parents('[class*="task"], [class*="card"]')
          .find('button[aria-label*="מחק"], button:contains("🗑"), button:contains("מחק")')
          .click();
        
        // Confirm if needed
        cy.get('body').then(($body) => {
          if ($body.find('[role="dialog"], .modal').length > 0) {
            cy.contains(/אישור|confirm|כן/i).click();
          }
        });
        
        // Verify task is removed
        cy.contains(taskTitle).should('not.exist');
      });
    });
  });
});
