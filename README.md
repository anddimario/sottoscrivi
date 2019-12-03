## Sottoscrivi

Basic subscription manager based on stripe

### Features

- stripe connection
- registration and login
- customer access 
- admin panel
- multilanguage

### Installation

- create a stripe account and configure plans
- create an `.env` file, example:

```
NODE_ENV=development
STRIPE_PUBLIC=
STRIPE_SECRET=
TITLE=My site
DATABASE_URL=mongodb://localhost/
DATABASE_NAME=sottoscrivi
SECRET_KEY=
SITE_URL=http://localhost:3000

```
- npm start
- create an admin: `node scripts/createAdmin email password`

### Test webhook locally

- npx localtunnel --port 3000
- add the url to webhook on stripe dashboard