
/*
Censored some parts of this
*/
import { edenIds } from '*****************'

describe('metadata settings tests', () => {
  beforeEach(() => {
    cy.intercept({
      method: 'GET',
      url: '**/audiences**',
    }).as('audiences')

    cy.visit('*****************')
    cy.loginAdminViaUI('*****************')
  })

  it.skip('[QUAL-1038] Verify metadata is saving properly', () => {
    cy.get('a:contains(Metadata)').click()

    // Select the national audience
    cy.get(edenIds.metadataAudienceSelect).click()
    cy.wait('@audiences')
    cy.get(edenIds.metadataAudienceSelect).type('national{enter}')

    cy.get(edenIds.metadataSectionSelect).click()
    cy.get('div[class$="-option"]:contains(Economy & Business)').click()
    cy.get(edenIds.rubricSelect).type('******** Investigates{enter}')

    cy.intercept({
      method: 'POST',
      url: '**/lock',
    }).as('submit')

    cy.get(edenIds.editorSaveContentButton).click()
    cy.wait('@submit')

    cy.reload()
    cy.get(edenIds.editorStartEditingButton).click()

    // After page refresh validation
    cy.get(edenIds.metadataAudienceSelect).should('contain.text', 'National') // Verify ************ selection
    cy.get(edenIds.metadataSectionSelect).should('contain.text', 'Economy & Business')
    cy.get(edenIds.rubricSelect).should('contain.text', '************* Investigates') // Verify *********** selection

    cy.get('div[aria-label="Remove Economy & Business"]').click()
    cy.get(edenIds.editorSaveContentButton).click()

    cy.reload()
    cy.get(edenIds.editorStartEditingButton).click()
    cy.get('div:contains(Economy & Business)').should('not.exist') // Verify that Economy & Business is still removed after refreshing
  })
})
