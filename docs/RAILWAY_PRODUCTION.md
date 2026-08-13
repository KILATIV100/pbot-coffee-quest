# Railway production — P-BOT Brovary Universe

## Topology

Use one Railway project with three services:

1. `web` — public frontend gateway from `apps/web`
2. `api` — private backend from `apps/api`
3. `Postgres` — Railway PostgreSQL

Only `web` needs a public domain. Browser requests use same-origin `/api/*`; `web` forwards them to the private API service. The API connects to Postgres with Railway's `DATABASE_URL` reference variable.

## Recommended Railway service setup

### Service: web
- Source: `KILATIV100/pbot-coffee-quest`
- Branch: `main`
- Root Directory: `/apps/web`
- Config file: `/apps/web/railway.toml`
- Public Networking: Generate Domain

Variables:
```text
NODE_ENV=production
API_INTERNAL_URL=http://${{api.RAILWAY_PRIVATE_DOMAIN}}:3001
```

Do not set `API_BASE_URL` in production; the web server exposes same-origin API proxying.

### Service: api
- Source: `KILATIV100/pbot-coffee-quest`
- Branch: `main`
- Root Directory: `/apps/api`
- Config file: `/apps/api/railway.toml`
- No public domain required

Variables:
```text
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REQUIRE_DATABASE=true
AUTO_MIGRATE=false
ALLOWED_ORIGIN=*
```

The fixed API port is intentional because the `web` service reaches the API over Railway private networking at port `3001`.

### Service: Postgres
Add Railway PostgreSQL to the same project. No public TCP proxy is required by the application.

## Health checks
- web: `/health`
- api: `/health`

The API health endpoint returns `503` if Postgres is required but unavailable. The web health endpoint checks the frontend process itself; API availability is handled separately by the API service health check.

## Database migration
`apps/api/railway.toml` runs `npm run migrate` as a Railway pre-deploy command. The migration creates the `scores` table and leaderboard indexes before the API process is promoted.

## Request flow
```text
Phone / Browser
      |
      | HTTPS
      v
 Railway web public domain
      |
      | /api/* proxy, Railway private network
      v
 api.railway.internal:3001
      |
      | DATABASE_URL reference
      v
 Railway Postgres
```

## Smoke tests after the first deployment
Open the web public domain and verify:

```text
GET /health
GET /api/health     (not used — API health is service-internal)
GET /api/meta
GET /api/worlds
GET /api/characters
GET /api/leaderboard?worldId=1
```

Then complete one game run and confirm `POST /api/runs` returns HTTP 201 and a new row appears in the leaderboard.

## Railway import note
Railway can automatically detect JavaScript workspaces when importing this repository. If services are created manually, set the Root Directory and custom config file paths above. Railway config-as-code files are deployment configuration only; they do not create the three services by themselves.
