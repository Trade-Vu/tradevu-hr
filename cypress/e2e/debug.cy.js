describe('Debug', () => {
  beforeEach(() => {
    cy.fixture('users').then(({ superAdmin }) => {
      cy.loginByApi(superAdmin.email, superAdmin.password)
      cy.visit('/')
    })
  })
  it('finds dashboard link', () => {
    cy.contains('a', /dashboard/i).then(($el) => {
      cy.writeFile('match_a.txt', $el[0].outerHTML)
    })
  })
})
