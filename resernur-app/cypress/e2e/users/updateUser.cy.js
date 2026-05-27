/* eslint-disable no-undef */

import { FRONT_BASE_URL } from "../constants.js";


describe('ACtualizar un usuario', () => {
    beforeEach(() => {
        cy.login('admin@admin.com', 'admin!123');
        cy.viewport(1280, 720);
    })

    it('Actualizar exitosamente un usuario', () => {
        cy.visit(FRONT_BASE_URL + "/admin");

        cy.get('[data-testid="admin-users"]').click();
        cy.wait(1000)
        cy.get('[title="Editar usuario"]').first().click();

    })
})