# P-BOT: Brovary Universe — Character Bible v1.0

Stage 1 is locked. This file is the source of truth for Stage 2 character production.

## Production rules
- Landscape-first 16:9 readability.
- Polished 3D-cartoon / 2.5D art.
- Runtime sprites require true alpha transparency and stable ground alignment.
- No official state emblems or government insignia on hostile units or boss vehicles; hostile designs use fictional marks only.

## Cast
- `pbot`: playable cyber-courier. Actions: idle, run, jump, double-jump, fall, crouch, land, stomp, hit, victory.
- `perky`: hovering assistant robot. States: idle, fly, point, scan, alert, happy, hologram, damaged.
- `kessi`: husky special ally. States: idle, run, leap, rush, search, bark, success, hit.
- `vitalii_npc`: PerkUp operations and engineering NPC. Poses: neutral, greeting, thumbs-up, thinking, explaining, coffee, warning, mission-complete.
- `marina`: PerkUp energy/support NPC. Poses: neutral, coffee/lab, greeting, success, explaining, warning.
- `dimon`: information/hacking NPC. Poses: neutral, greeting, thinking, holographic-map, pointing, alert, thumbs-up.
- `charme_master`: mobility and footwear upgrade NPC. Poses: neutral-with-shoe, presenting, thumbs-up, repair, explaining, success.
- `semkych`: recurring mini-boss. States: idle, move, wind-up, seed-throw, jump, trap, phase-change, hit, defeated.

## Five enemy archetypes
1. `enemy_spam_bot` — GROUND patrol.
2. `enemy_scooter` — FAST horizontal threat.
3. `enemy_spy_drone` — AIR patrol and scan.
4. `enemy_paper_shooter` — RANGED projectile attacker.
5. `enemy_municipal_bot` — HEAVY shield/charge blocker.

Worlds may reskin these archetypes while retaining reusable AI behavior.

## Main boss
- `boss_the_official`: fictional satirical bureaucracy boss.
- `boss_bureaucracy_bulldozer`: 16:9 boss vehicle with loudspeaker array, stamp arm, document shredder intake, barrier launcher, drone bay and command cockpit.

Required boss states: intro, combat-idle, loudspeaker, barrier-deploy, drone-launch, stamp-attack, damaged, defeated.

## Export names
Lowercase ASCII kebab-case, for example `pbot-run-01.webp`, `perky-scan-01.webp`, `kessi-rush-03.webp`, `enemy-spy-drone-scan.webp`, `boss-bulldozer-stamp-04.webp`.
