const email = 'e2e@example.com';
const password = 'password';

describe('Customer', () => {

  before(function () {

    cy.visit('/login');

    cy.get('input[name=email]').type(email);

    // {enter} causes the form to submit
    cy.get('input[name=password]').type(`${password}{enter}`);

    // we should be redirected to /dash
    cy.url().should('include', '/customer');

  });

  it('update - add fullname', () => {
    const fullname = 'Test Fullname';
    // fill out a form field
    cy.get('input[name="name"]')
      .type(fullname);

    // simulate clicking submit
    cy.get('#updateInfo')
      .click();
    cy.get('#inputName').should('have.attr', 'placeholder', fullname);
  });

  it('deactive', () => {
    cy.visit('/customer');

    cy.get('.deactive-link')
      .click();
  });
});

