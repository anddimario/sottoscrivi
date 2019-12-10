const email = 'e2e@example.com';
const password = 'password';

before(() => {
  cy.log('Create seed data');
  cy.exec('node scripts/seed.js create');
  cy.exec('node scripts/createAdmin.js e2e.admin@example.com password');
});

describe('Home Page', () => {
  it('has the correct title', () => {
    cy.visit('/');
    cy.title().should('equal', 'My site');
  });

  it('change language', () => {
    cy.contains('Italiano').click();
    cy.contains('h1', 'Registrati');
  });
});

/*
// problems with stripe checkout redirect
// need: "chromeWebSecurity": false in cypress.json
describe('Registration', () => {
  it('go and register', () => {
    cy.visit('/');

    // fill out a form field
    cy.get('input[name="email"]')
      .type(email)
      .get('input[name="password"]')
      .type(password);

    // simulate clicking submit
    cy.get('#register-button')
      .click();

    //cy.get('.alert').contains('Registration successful');
    // click (page starts reloading)
    cy.wait(5000);
    // check the changed content
  });
});
*/

describe('Login', function () {
  it('login', function () {

    cy.visit('/login');

    cy.get('input[name=email]').type(email);

    // {enter} causes the form to submit
    cy.get('input[name=password]').type(`${password}{enter}`);

    // we should be redirected to /dash
    cy.url().should('include', '/customer');

    // UI should reflect this user being logged in
    cy.contains('ciao');

  });
});
