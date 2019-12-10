const email = 'e2e.admin@example.com';
const password = 'password';

describe('Admin', () => {

  before(function () {

    cy.visit('/login');

    cy.get('input[name=email]').type(email);

    // {enter} causes the form to submit
    cy.get('input[name=password]').type(`${password}{enter}`);

    // we should be redirected to /admin
    cy.url().should('include', '/admin');

  });

  it('see customer', () => {
    const customer = 'e2e@example.com';
    cy.visit('/admin/customers/list');
    cy.contains(customer);
    cy.get('.see-link').first().click();
    cy.url().should('include', '/admin/customers/details');
    cy.contains('User Info');
    cy.get('.delete-link').click();
    cy.url().should('include', '/admin/customers/list');

//    cy.get('#inputName').should('have.attr', 'placeholder', fullname);
  });
});
