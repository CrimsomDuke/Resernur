/* eslint-disable no-undef */
import { API_BASE_URL, FRONT_BASE_URL } from '../constants.js'

describe('Flujo de Administración: Gestión de Reservas', () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.login('admin@admin.com', 'admin!123');
    cy.visit(FRONT_BASE_URL);
  });

  const formatDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper para seleccionar el primer espacio reservable
  const clickFirstReservableSpace = () => {
    cy.wait(1000);
    cy.get('[data-testid^="space-card-"]').then($cards => {
      const tryIndex = (i) => {
        if (i >= $cards.length) throw new Error('No reservable space found');
        cy.wrap($cards[i]).click();
        cy.contains('button', 'Continuar Reserva').then($btn => {
          if ($btn.is(':disabled')) {
            tryIndex(i + 1);
          } else {
            cy.wrap($btn).click();
          }
        });
      };
      tryIndex(0);
    });
  };

  it('Debe crear una solicitud, navegar a Solicitudes Pendientes y aceptarla', () => {
    // 1. Crear una solicitud de reserva única
    const uniqueReason = `E2E-Aceptar-${Date.now()}`;

    // Interceptar la creación de la solicitud para obtener el ID
    cy.intercept('POST', `${API_BASE_URL}/booking-requests`).as('createBooking');

    clickFirstReservableSpace();

    const date = formatDate(3); // más de 48 horas
    cy.get('form').within(() => {
      cy.get('input[type="date"]').clear().type(date);
      cy.get('input[type="number"]').clear().type('1');
      cy.get('input[type="time"]').eq(0).clear().type('10:00');
      cy.get('input[type="time"]').eq(1).clear().type('12:00');
      cy.get('textarea').clear().type(uniqueReason);
      cy.contains('button', 'Enviar Solicitud').click();
    });

    // Esperar la respuesta y extraer el ID
    cy.wait('@createBooking').then((interception) => {
      expect(interception.response.statusCode).to.eq(201);
      const requestId = interception.response.body?.data?.id || interception.response.body?.id;
      console.log(interception.response.body);
      expect(requestId).to.exist;
      cy.log(`Solicitud creada con ID: ${requestId}`);
      cy.wrap(requestId).as('createdRequestId');
    });

    // 2. Navegar al panel de administración
    cy.visit('http://localhost:5173/admin'); // o usar FRONT_BASE_URL + '/admin'
    cy.get('aside, nav').should('be.visible');

    // 3. Acceder a Solicitudes Pendientes desde el Dashboard
    cy.get('[data-testid="metric-card-pending"]')
      .should('be.visible')
      .click();

    // Verificar que estamos en la vista de solicitudes
    cy.get('h2, h1').contains(/Solicitudes/i).should('be.visible');

    // 4. Buscar la fila que contiene el motivo único y hacer clic en aceptar
    // Esperar a que la tabla cargue las solicitudes
    cy.contains('td', uniqueReason, { timeout: 10000 })
      .parents('tr')
      .within(() => {
        // Hacer clic en el botón de aceptar dentro de esta fila
        cy.get('[data-testid="accept-request-btn"]').click();
      });

    // 5. Verificar que la solicitud ya no aparece en la lista de pendientes
    cy.contains('td', uniqueReason, { timeout: 10000 }).should('not.exist');
  });
});