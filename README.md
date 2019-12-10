# Sottoscrivi

Subscription manager based on stripe

## Features

- registration, login and password recovery
- customer access with plan management
- admin panel
- multilanguage for app and email
- stripe checkout and connection

### Installation

- create a stripe account and configure plans
- create an `.env` file, example:

```bash
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

### Send email cron

- registration: add as cron `scripts/notifyRegistration`
- password reset: add as cron `scripts/notifyPasswordReset`

### Test webhook locally

- npx localtunnel --port 3000
- add the url to webhook on stripe dashboard