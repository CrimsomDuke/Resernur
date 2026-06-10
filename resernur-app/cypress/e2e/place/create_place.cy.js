/* eslint-disable no-undef */

import { API_BASE_URL, FRONT_BASE_URL } from "../constants.js"


describe('Creaete place FLow', () => {
    beforeEach(() => {
        cy.login('admin@admin.com', 'admin!123')
        cy.visit(FRONT_BASE_URL + '/admin')

        cy.viewport(1280, 720)
        cy.get('[data-testid="admin-create-space"]').click()
    })

    it('Crea un espacio correctamente', () => {

        cy.intercept('POST',  API_BASE_URL + '/places').as('createPlaceRequest');

        cy.get('[data-testid="create-space-name"]').type("prueba")
        cy.get('[data-testid="create-space-capacity"]').type(10)
        cy.get('[data-testid="create-space-location"]').type("prueba locatiin")
        cy.get('[data-testid="create-space-userInCharge"]').select('20');
        cy.get('[data-testid="create-space-description"]').type('prueba desde el e2e del front');
        cy.get('[data-testid="create-space-submit-button"]').click();

        cy.wait('@createPlaceRequest').its('response.statusCode').should('eq', 201);

    })
})