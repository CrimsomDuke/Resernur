/* eslint-disable no-undef */
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

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