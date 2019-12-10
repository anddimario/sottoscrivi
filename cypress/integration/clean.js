// Use this to do task before close
const email = 'e2e@example.com';
const password = 'password';

before(() => {
  cy.log('Remove seed data');
  cy.exec('node scripts/seed.js remove');
});


describe('Login', function () {
  it('user not found', function () {

    cy.visit('/login');

    cy.get('input[name=email]').type(email);

    // {enter} causes the form to submit
    cy.get('input[name=password]').type(`${password}{enter}`);

    // UI should reflect this user being logged in
    cy.contains('The username does not exists');

  });
});