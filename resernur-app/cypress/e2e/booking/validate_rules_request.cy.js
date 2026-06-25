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

  // Pure command-chain iteration helper
  const clickFirstReservableSpace = () => {
    cy.wait(1000) // Allow API items to populate the grid

    cy.get('[data-testid^="space-card-"]').then(($cards) => {
      const totalCards = $cards.length

      const tryCard = (i) => {
        if (i >= totalCards) {
          throw new Error('Tested all available space cards, but none of them have an active reservation button.')
        }

        // 1. Click the space card to load its information block into the panel
        cy.get('[data-testid^="space-card-"]').eq(i).click()
        cy.wait(400) // Smooth pause for React state + conditional render transition

        // 2. Check the updated state of the Room Fact Sheet container
        cy.get('body').then(($body) => {
          const $btn = $body.find("button:contains('Continuar Reserva')")

          // If the active button text isn't found or it's locked out by maintenance:
          if ($btn.length === 0 || $btn.is(':disabled')) {
            cy.log(`Space card at index ${i} is locked or unavailable. Shifting to next asset...`)
            tryCard(i + 1) // Loop safely on the command chain
          } else {
            // Success! The space is open and active. Let's progress into the form modal.
            cy.wrap($btn).click()
          }
        })
      }

      tryCard(0) // Begin scanning at index 0
    })
  }

  it('should NOT create a booking when the start time is before 07:00', () => {
    cy.intercept('POST', `${API_BASE_URL}/booking-requests`).as('createBooking')

    clickFirstReservableSpace()

    const date = formatDate(3) // Ensure date is >48 hours in the future so time validation is isolated

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