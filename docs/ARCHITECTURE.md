# Architecture

`apps/web` is a mobile-first Canvas game client. `apps/api` exposes world/character metadata, health, run submission and leaderboard endpoints. Railway can deploy both from the same repository as separate services.

The game preserves the Coffee Quest movement model: left/right movement, crouch, variable jump, double jump, coyote time, jump buffer, squash/stretch, collectibles, hazards, checkpoints and level completion.
