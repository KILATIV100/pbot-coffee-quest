# Railway deployment

Production source of truth: [`RAILWAY_PRODUCTION.md`](./RAILWAY_PRODUCTION.md).

Topology:
- `web` — public service, root `/apps/web`, config `/apps/web/railway.toml`
- `api` — private service, root `/apps/api`, config `/apps/api/railway.toml`
- `Postgres` — Railway PostgreSQL in the same project

Web variables:
```text
NODE_ENV=production
API_INTERNAL_URL=http://${{api.RAILWAY_PRIVATE_DOMAIN}}:3001
```

API variables:
```text
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REQUIRE_DATABASE=true
AUTO_MIGRATE=false
ALLOWED_ORIGIN=*
```

Only `web` needs a public Railway domain. Browser `/api/*` requests are proxied by `web` to the private API service. The API uses the Railway Postgres reference variable. API migrations run in the pre-deploy step.
