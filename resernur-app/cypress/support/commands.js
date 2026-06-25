/* eslint-disable no-undef */


import { API_BASE_URL, FRONT_BASE_URL } from "../e2e/constants.js"

Cypress.Commands.add('login', (email, password) => {
    cy.session(
        email,
        () => {
            cy.visit(FRONT_BASE_URL + '/login')
            cy.intercept('POST', 'http://localhost:5000/api/auth/login').as("loginRequest"); 

            //ACT
            //obtener los campos necesarios e interactuar con la IU
            cy.get('[data-testid="email-field"]').type(email);
            cy.get('[data-testid="password-field"]').type(password);
            cy.get('[data-testid="login-button"]').click();

            cy.url().should('include', '/admin')
        },
        {

        }
    )
})