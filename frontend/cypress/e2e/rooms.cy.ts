/// <reference types="cypress" />

describe('Rooms Management', () => {
  const testUser = {
    email: `rooms-test-${Date.now()}@example.com`,
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
    cy.visit('/home');
  });

  describe('Room List', () => {
    it('should display home page with room cards', () => {
      cy.url().should('include', '/home');
      
      // Page should load
      cy.contains(/חדרים|rooms/i).should('be.visible');
    });

    it('should show empty state when no rooms', () => {
      // Check for empty state or room list
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="room-card"]').length === 0) {
          // Empty state should be visible
          cy.contains(/אין חדרים|no rooms|הוסף חדר/i).should('be.visible');
        }
      });
    });
  });

  describe('Create Room', () => {
    it('should create a new room via UI', () => {
      const roomName = `סלון טסט ${Date.now()}`;
      
      // Find and click add room button
      cy.contains(/הוסף חדר|add room|חדש/i).click();
      
      // Fill in room name
      cy.get('input[name="name"], input[placeholder*="שם"]')
        .should('be.visible')
        .type(roomName);
      
      // Submit form
      cy.get('button[type="submit"], button:contains("שמור"), button:contains("צור")')
        .click();
      
      // Verify room appears in list
      cy.contains(roomName).should('be.visible');
    });

    it('should create a room via API and display it', () => {
      const roomName = `מטבח טסט ${Date.now()}`;
      
      cy.createRoom(roomName).then((roomId) => {
        expect(roomId).to.be.a('number');
        
        // Refresh and verify room appears
        cy.reload();
        cy.contains(roomName).should('be.visible');
      });
    });

    it('should show validation error for empty room name', () => {
      cy.contains(/הוסף חדר|add room|חדש/i).click();
      
      // Try to submit without name
      cy.get('button[type="submit"], button:contains("שמור"), button:contains("צור")')
        .click();
      
      // Should show validation error
      cy.get('input:invalid').should('exist');
    });
  });

  describe('Room Navigation', () => {
    let roomId: number;
    const roomName = `חדר ניווט ${Date.now()}`;

    before(() => {
      cy.loginViaApi(testUser.email, testUser.password);
      cy.createRoom(roomName).then((id) => {
        roomId = id;
      });
    });

    it('should navigate to room detail page on click', () => {
      cy.visit('/home');
      
      // Click on room card
      cy.contains(roomName).click();
      
      // Should navigate to room page
      cy.url().should('include', `/room/${roomId}`);
      
      // Room name should be visible
      cy.contains(roomName).should('be.visible');
    });

    it('should display room progress bar', () => {
      cy.visit('/home');
      
      // Room card should have progress indicator
      cy.contains(roomName)
        .parents('[class*="card"], a')
        .find('[class*="progress"], [role="progressbar"]')
        .should('exist');
    });
  });

  describe('Room Types Detection', () => {
    const roomTypes = [
      { name: 'סלון', emoji: '🛋️' },
      { name: 'מטבח', emoji: '🍳' },
      { name: 'חדר שינה', emoji: '🛏️' },
      { name: 'אמבטיה', emoji: '🚿' },
      { name: 'משרד', emoji: '💼' },
      { name: 'מרפסת', emoji: '🌿' },
    ];

    roomTypes.forEach(({ name, emoji }) => {
      it(`should detect "${name}" room type and show ${emoji}`, () => {
        const fullName = `${name} ${Date.now()}`;
        
        cy.createRoom(fullName).then(() => {
          cy.reload();
          cy.contains(fullName)
            .parents('[class*="card"], a')
            .should('contain', emoji);
        });
      });
    });
  });

  describe('Delete Room', () => {
    it('should delete a room', () => {
      const roomName = `חדר למחיקה ${Date.now()}`;
      
      cy.createRoom(roomName).then((roomId) => {
        cy.reload();
        
        // Navigate to room or find delete button
        cy.contains(roomName).click();
        
        // Find and click delete button
        cy.contains(/מחק|delete/i).click();
        
        // Confirm deletion if modal appears
        cy.get('body').then(($body) => {
          if ($body.find('[role="dialog"], .modal').length > 0) {
            cy.contains(/אישור|confirm|כן/i).click();
          }
        });
        
        // Verify room is removed
        cy.visit('/home');
        cy.contains(roomName).should('not.exist');
      });
    });
  });
});
