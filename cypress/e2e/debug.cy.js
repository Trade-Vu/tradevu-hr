describe('Debug', () => {
  beforeEach(() => {
    cy.fixture('users').then(({ superAdmin }) => {
      cy.loginByApi(superAdmin.email, superAdmin.password)
      cy.visit('/')
    })
  })
  it('finds dashboard link', () => {
    cy.contains('a', 'Overview')
  })
})
