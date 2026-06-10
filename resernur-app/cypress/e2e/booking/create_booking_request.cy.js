/* eslint-disable no-undef */
import { API_BASE_URL, FRONT_BASE_URL } from '../constants.js'

describe('Create booking requests - validation rules', () => {
  beforeEach(() => {
    // reuse existing login command to ensure we have an authenticated session
    cy.login('admin@admin.com', 'admin!123')
    cy.visit(FRONT_BASE_URL)
    cy.viewport(1280, 720)
  })

  const formatDate = (offsetDays) => {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  // helper: click the first space card whose Continue button is enabled
  const clickFirstReservableSpace = () => {
    
    //wait until the space cards are loaded
    cy.wait(1000) 

    cy.get('[data-testid^="space-card-"]').then($cards => {
      // try each card until the Continue button is enabled
      const tryIndex = (i) => {
        if (i >= $cards.length) throw new Error('No reservable space found for the test')
        cy.wrap($cards[i]).click()
        cy.contains('button', 'Continuar Reserva').then($btn => {
          if ($btn.is(':disabled')) {
            tryIndex(i + 1)
          } else {
            cy.wrap($btn).click()
          }
        })
      }
      tryIndex(0)
    })
  }

  it('should NOT create a booking when the date is less than 48 hours in advance', () => {
    cy.intercept('POST', `${API_BASE_URL}/booking-requests`).as('createBooking')

    clickFirstReservableSpace()

    const date = formatDate(1) // 1 day ahead -> less than 48 hours

    // fill the form
    cy.get('form').within(() => {
      cy.get('input[type="date"]').clear().type(date)
      cy.get('input[type="number"]').clear().type('1')
      cy.get('input[type="time"]').eq(0).clear().type('10:00')
      cy.get('input[type="time"]').eq(1).clear().type('12:00')
      cy.get('textarea').clear().type('E2E: Reserva con menos de 48 horas de antelación')
      cy.contains('button', 'Enviar Solicitud').click()
    })

    // backend validation should reject the request; assert we didn't get a 201 Created
    cy.wait('@createBooking').its('response.statusCode').should('not.eq', 201)
    cy.get('[data-testid="error-message"]').should('be.visible')
  })

  it('should NOT create a booking when the start time is before 07:00', () => {
    cy.intercept('POST', `${API_BASE_URL}/booking-requests`).as('createBooking')

    clickFirstReservableSpace()

    const date = formatDate(3) // ensure date is >48 hours in the future so time validation is isolated

    cy.get('form').within(() => {
      cy.get('input[type="date"]').clear().type(date)
      cy.get('input[type="number"]').clear().type('1')
      // start before 07:00 should be rejected by server validation
      cy.get('input[type="time"]').eq(0).clear().type('06:00')
      cy.get('input[type="time"]').eq(1).clear().type('08:00')
      cy.get('textarea').clear().type('E2E: Reserva con hora de inicio antes de las 07:00')
      cy.contains('button', 'Enviar Solicitud').click()
    })

    cy.wait('@createBooking').its('response.statusCode').should('not.eq', 201)
    cy.get('[data-testid="error-message"]').should('be.visible')
  })
})
