# Fact Public Frontend

Public frontend for the Find a Court or Tribunal (FaCT) service.

## Getting Started

### Prerequisites

Running the application requires the following tools to be installed in your environment:

- [Node.js](https://nodejs.org/) v22.21.1 or later
- [Corepack](https://nodejs.org/api/corepack.html) (bundled with Node.js, used to manage Yarn)
- [Docker](https://www.docker.com) (optional)
- `openssl` (for local HTTPS certificate generation)

Enable Corepack and install dependencies:

```bash
corepack enable
yarn install
```

### Running the application

#### Local development (recommended)

This mode runs over HTTPS, generates local SSL certs automatically, and restarts when source files change.

```bash
yarn start:dev
```

The application's home page will be available at https://localhost:3344

#### Production-like local run

Build static assets and run the production server:

```bash
yarn build
yarn start
```

The application will be available at http://localhost:3344

## Session Management

We use `express-session` to manage user sessions. This is configured in [`src/main/app.ts`](src/main/app.ts).

- `SESSION_SECRET` controls the session signing secret (falls back to config default for local development).
- `SESSION_COOKIE_SAME_SITE` can be set to `strict`, `lax` (default), or `none`.
- Session cookies are configured as `secure`, so HTTPS is required in local development (`yarn start:dev`) or TLS termination must be in front of the app.

## Environment Variables

Common variables for local development and test execution:

- `DATA_API_URL` (default: `http://localhost:8989`)
- `SESSION_SECRET`
- `SESSION_COOKIE_SAME_SITE`
- `AZURE_TENANT_ID`
- `API_APP_REG_ID`
- `FRONTEND_APP_REG_ID`
- `FRONTEND_APP_REG_SECRET`
- `DYNATRACE_JSTAG_KEY`

For functional tests, copy `.env.example` to `.env` and adjust values as needed.

## Running with Docker

Create docker image:

```bash
docker-compose build
```

Run the application by executing the following command:

```bash
docker-compose up
```

This will start the frontend container exposing port `3344`.

## Developing

### Code style

We use [ESLint](https://github.com/typescript-eslint/typescript-eslint),
[Stylelint](https://stylelint.io/) and [Prettier](https://prettier.io/).

Run lint checks:

```bash
yarn lint
```

Running linting with auto fix:

```bash
yarn lint:fix
```

### Running the tests

This project uses [Jest](https://jestjs.io/) for unit and route tests, and [Playwright](https://playwright.dev/) for browser tests.

Run unit tests:

```bash
yarn test
# or
yarn test:unit
```

Run route tests:

```bash
yarn test:routes
```

Run coverage:

```bash
yarn test:coverage
```

Run functional tests:

```bash
yarn test:functional
```

Project-specific functional runs:

```bash
yarn test:functional:chrome
yarn test:functional:edge
yarn test:functional:firefox
yarn test:functional:webkit
```

Run smoke and performance suites:

```bash
yarn test:smoke
yarn test:performance
```

Accessibility checks run as part of the functional suite:

```bash
yarn test:a11y
```

The default project matrix is Chrome, Edge, Firefox and WebKit. Preview builds (`ENV=preview`) run Edge only.

Functional and accessibility tests create temporary data through the Data API testing-support endpoints.
Set `DATA_API_URL` to the target data-api host if it is not running on `http://localhost:8989`.
Set `TEST_URL` if the frontend is not running on `https://localhost:3344`.

The suites rely on these endpoints:

- `GET /testing-support/courts`
- `DELETE /testing-support/courts/name-prefix/{courtNamePrefix}`
- `GET /testing-support/service-centres`
- `DELETE /testing-support/service-centres/name-prefix/{serviceCentreNamePrefix}`
- `GET /testing-support/regions`

### Security

#### CSRF

A reusable CSRF macro is available in [`src/main/views/macros/csrf.njk`](src/main/views/macros/csrf.njk):

```njk
{% from "macros/csrf.njk" import csrfProtection %}
...
<form ...>
  ...
  {{ csrfProtection(csrfToken) }}
  ...
</form>
...
```

If you introduce or enable CSRF middleware, make sure every state-changing form includes the token.

#### Helmet

This application uses [Helmet](https://helmetjs.github.io/), which adds security-related HTTP headers.
Configuration is defined in [`src/main/modules/helmet/index.ts`](src/main/modules/helmet/index.ts).

Alongside default Helmet behaviour, the application sets:

- [Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [Content-Security-Policy](https://helmetjs.github.io/docs/csp/)
- [Referrer-Policy](https://helmetjs.github.io/docs/referrer-policy/)
- [Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)

### Healthcheck

The application exposes health endpoints using
[@hmcts/nodejs-healthcheck](https://github.com/hmcts/nodejs-healthcheck).
These endpoints are defined in [`src/main/controllers/HealthController.ts`](src/main/controllers/HealthController.ts):

- `/health`
- `/health/liveness`
- `/health/readiness`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
