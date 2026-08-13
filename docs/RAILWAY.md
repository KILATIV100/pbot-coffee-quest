# Railway deployment

Use one GitHub repository and two Railway services.

## API service

- Root directory: `apps/api`
- Start command: `npm start`
- Health: `/health`
- Optional PostgreSQL: attach Railway Postgres; `DATABASE_URL` is detected automatically.
- Optional `ALLOWED_ORIGIN`: set to the public web URL.

## Web service

- Root directory: `apps/web`
- Start command: `npm start`
- Health: `/health`
- Required production variable: `API_BASE_URL=https://<api-service-domain>`

## Deploy flow

1. Connect repository to Railway.
2. Create API service from the repo with root `apps/api`.
3. Add PostgreSQL if persistent leaderboard is required.
4. Generate API public domain.
5. Create Web service from the same repo with root `apps/web`.
6. Set `API_BASE_URL` to API public domain.
7. Set API `ALLOWED_ORIGIN` to Web public domain.
