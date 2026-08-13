# P-BOT: Brovary Universe

Full-stack expansion of **P-BOT: Coffee Quest** into a mobile platformer inspired by Brovary, Ukraine.

## Current branch

Development branch: `brovary-universe`.

## Core gameplay

- left/right movement
- crouch
- variable-height jump
- double jump
- coyote time
- jump buffer
- squash/stretch
- collectibles
- hazards
- checkpoints
- level finish

## Playable characters

1. P-BOT
2. Brovary Hero
3. Vitalii

The two human heroes use newly prepared transparent production sprite sheets.

## Brovary worlds

The project contains a 15-world catalog ranging from Розвилка, Парк Перемоги and Приозерний through Трамвай 23, Аеродром, Торгмаш and Радіодистрикт to Future Brovary Core.

## Full-stack structure

- `apps/web` — mobile-first Canvas frontend/game client
- `apps/api` — Node API for world/character metadata, run results and leaderboard
- `docs/WORLDS.md` — 15-world plan
- `docs/RAILWAY.md` — Railway deployment layout
- `docs/SPRITES.md` — sprite pipeline

## Railway

Deploy two services from this repository:

- Web service root: `apps/web`
- API service root: `apps/api`

Set `API_BASE_URL` on the web service to the public API URL. Attach Railway PostgreSQL to the API to enable persistent leaderboard storage through `DATABASE_URL`.
