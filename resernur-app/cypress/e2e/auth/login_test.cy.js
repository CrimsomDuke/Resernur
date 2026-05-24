/* eslint-disable no-undef */

describe("Login flow", () => {
    beforeEach(() => {
        cy.visit("http://localhost:5173/login") //ir a la pagina del login antes de cada test
    })

    it('Se logea correctamente', () => {
        //el intercept sirve para "crear un objeto" de la request que se tiene que hacer
        cy.intercept('POST', 'http://localhost:5000/api/auth/login').as("loginRequest"); 

        //ACT
        //obtener los campos necesarios e interactuar con la IU
        cy.get('[data-testid="email-field"]').type("admin@admin.com");
        cy.get('[data-testid="password-field"]').type("admin!123");
        cy.get('[data-testid="login-button"]').click();

        //Assert
        //usamis el nombre del intercept que creamos
        //accedemos a su propiedad mediante its
        //hacemos un assertion usando eq (==) y el value
        cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

        cy.url().should('include', 'admin')
    })

    it('Error al logearse', () => {
        cy.intercept('POST', 'http://localhost:5000/api/auth/login').as('loginRequest');

        //act
        cy.get('[data-testid="email-field"]').type('admin@admin.com');
        cy.get('[data-testid="password-field"]').type('test123');
        cy.get('[data-testid="login-button"]').click();

        cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);
        cy.get('[data-testid="login-error"]').contains('inválidas')
    })
})