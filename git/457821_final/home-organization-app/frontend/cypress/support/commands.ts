/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login with email and password
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Login via API (faster for setup)
       */
      loginViaApi(email: string, password: string): Chainable<string>;
      
      /**
       * Register a new user
       */
      register(email: string, password: string, name?: string): Chainable<void>;
      
      /**
       * Logout current user
       */
      logout(): Chainable<void>;
      
      /**
       * Create a room
       */
      createRoom(name: string): Chainable<number>;
      
      /**
       * Create a task in a room
       */
      createTask(roomId: number, title: string, description?: string): Chainable<number>;
      
      /**
       * Create a todo for a task
       */
      createTodo(taskId: number, title: string): Chainable<number>;
      
      /**
       * Set up WebSocket listener
       */
      setupWebSocket(): Chainable<WebSocket>;
      
      /**
       * Wait for WebSocket message
       */
      waitForWsMessage(timeout?: number): Chainable<any>;
      
      /**
       * Get element by data-testid
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Check if element contains Hebrew text
       */
      containsHebrew(text: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// ==================== Authentication Commands ====================

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  
  cy.get('input[type="email"], input[name="email"]')
    .should('be.visible')
    .clear()
    .type(email);
    
  cy.get('input[type="password"], input[name="password"]')
    .should('be.visible')
    .clear()
    .type(password);
    
  cy.get('button[type="submit"]')
    .should('be.visible')
    .click();
    
  // Wait for redirect to home page
  cy.url().should('include', '/home');
  
  // Verify token is stored
  cy.window().its('localStorage.token').should('exist');
});

Cypress.Commands.add('loginViaApi', (email: string, password: string) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/login`,
    body: {
      username: email,
      password: password,
    },
    form: true,
  }).then((response) => {
    expect(response.status).to.eq(200);
    const token = response.body.access_token;
    
    // Store token in localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('token', token);
    });
    
    return token;
  });
});

Cypress.Commands.add('register', (email: string, password: string, name?: string) => {
  cy.visit('/register');
  
  if (name) {
    cy.get('input[name="name"]')
      .should('be.visible')
      .type(name);
  }
  
  cy.get('input[type="email"], input[name="email"]')
    .should('be.visible')
    .type(email);
    
  cy.get('input[type="password"], input[name="password"]')
    .should('be.visible')
    .type(password);
    
  cy.get('button[type="submit"]')
    .should('be.visible')
    .click();
    
  // Wait for success
  cy.url().should('not.include', '/register');
});

Cypress.Commands.add('logout', () => {
  // Click logout button
  cy.get('[aria-label="התנתק מהחשבון"], button:contains("התנתק")')
    .should('be.visible')
    .click();
    
  // Verify redirect to login
  cy.url().should('include', '/login');
  
  // Verify token is removed
  cy.window().its('localStorage.token').should('not.exist');
});

// ==================== CRUD Commands ====================

Cypress.Commands.add('createRoom', (name: string) => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    
    return cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/rooms`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        name: name,
      },
    }).then((response) => {
      expect(response.status).to.eq(201);
      return response.body.id;
    });
  });
});

Cypress.Commands.add('createTask', (roomId: number, title: string, description?: string) => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    
    return cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/tasks`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        title,
        description: description || '',
        room_id: roomId,
      },
    }).then((response) => {
      expect(response.status).to.eq(201);
      return response.body.id;
    });
  });
});

Cypress.Commands.add('createTodo', (taskId: number, title: string) => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    
    return cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/todos`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        title,
        task_id: taskId,
      },
    }).then((response) => {
      expect(response.status).to.eq(201);
      return response.body.id;
    });
  });
});

// ==================== WebSocket Commands ====================

let wsInstance: WebSocket | null = null;
let wsMessages: any[] = [];

Cypress.Commands.add('setupWebSocket', () => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    const wsUrl = `ws://localhost:8000/ws?token=${token}`;
    
    wsMessages = [];
    
    return new Cypress.Promise((resolve, reject) => {
      wsInstance = new WebSocket(wsUrl);
      
      wsInstance.onopen = () => {
        cy.log('WebSocket connected');
        resolve(wsInstance as WebSocket);
      };
      
      wsInstance.onmessage = (event) => {
        const data = JSON.parse(event.data);
        wsMessages.push(data);
        cy.log('WebSocket message received:', data);
      };
      
      wsInstance.onerror = (error) => {
        cy.log('WebSocket error:', error);
        reject(error);
      };
      
      wsInstance.onclose = () => {
        cy.log('WebSocket closed');
      };
    });
  });
});

Cypress.Commands.add('waitForWsMessage', (timeout = 10000) => {
  return cy.wrap(null).then(() => {
    return new Cypress.Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkMessages = () => {
        if (wsMessages.length > 0) {
          const message = wsMessages.shift();
          resolve(message);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for WebSocket message'));
        } else {
          setTimeout(checkMessages, 100);
        }
      };
      
      checkMessages();
    });
  });
});

// ==================== Utility Commands ====================

Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('containsHebrew', (text: string) => {
  return cy.contains(text);
});

export {};
