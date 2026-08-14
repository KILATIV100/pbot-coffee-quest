# Stage 2 Production Backlog — WORLD 01 / LEVEL 01

Status: active
Target: production-quality vertical slice for `01-01 · Місто прокидається`
Parent issue: #3

## Release rule

Наступну збірку не називаємо vertical slice, доки P0 не закрито. P1 і P2 йдуть тільки після стабілізації P0.

---

# P0 — CLEANUP GATE

Issue: #4

## Sprite pipeline
- [x] P-BOT: true alpha, без чорного/світлого фону, без ореолів
- [x] Perky: true alpha, consistent crop/anchor
- [x] Spam Bot: true alpha, consistent crop/anchor
- [x] Scooter: true alpha, consistent crop/anchor
- [x] Spy Drone: true alpha, consistent crop/anchor
- [x] Єдиний baseline/scale policy для hero / companion / enemy
- [x] Sprite cells не можуть містити фон сцени або прямокутну підкладку

## P-BOT animation states
- [x] idle
- [x] run
- [ ] jump-start
- [x] jump-air
- [x] fall — використовує air state до окремого art-frame
- [ ] land
- [x] crouch — окремий sprite/state, НЕ scale-down
- [ ] hit
- [x] victory — state підготовлений, окремий art-frame ще в P1

## Collision / trigger cleanup
- [x] Перерахувати player hitbox окремо від sprite bounds
- [x] Окремий crouch hitbox
- [x] Невидимі legacy finish/win triggers видалити
- [x] Невидимі legacy checkpoint triggers видалити
- [x] Невидимі debug collision surfaces видалити або прив'язати до видимих об'єктів
- [x] Кожен trigger повинен мати видиму ігрову причину
- [x] Перевірити spawn / respawn / camera bounds

## P0 acceptance gate
- [x] Exact alpha assets проходять CI validation
- [x] Crouch технічно є окремою позою + окремим hitbox
- [x] Completion можливий лише через видимий finish gate
- [x] Checkpoint можливий лише через видимий terminal
- [ ] Візуальна перевірка на реальному Mobile Safari
- [ ] Desktop Safari/Chrome playtest

---

# P1 — GAMEPLAY & ABILITIES

Issue: #5
Blocked by: P0 / #4

## Core controller
- [x] run acceleration/deceleration
- [x] variable jump
- [x] coyote time
- [x] jump buffer
- [ ] double jump
- [x] crouch
- [x] stomp
- [x] hit / knockback / invulnerability

## Power-ups / суперсили

### PerkUp Nitro
- [x] pickup object
- [x] speed boost
- [x] jump boost
- [x] timer
- [ ] VFX / trail
- [x] HUD indicator
- [x] pickup feedback

### Double Jump Module
- [ ] collectible/module
- [ ] unlock upper route
- [ ] distinct air VFX
- [ ] second-jump animation cue

### CHARME Speed Shoes
- [x] pickup
- [x] speed/mobility modifier
- [ ] distinct visual state
- [ ] route value: access/shortcut, not cosmetic only

### Kessi Assist
- [ ] summon pickup/charge
- [ ] Kessi rush forward
- [ ] clears ground enemies
- [ ] short invulnerability/safe window
- [ ] cooldown or limited-use rule

### Perky Info Pulse
- [ ] scan animation
- [ ] highlight secret entrance
- [ ] highlight hazard
- [ ] highlight collectible chain
- [ ] optional hint UI

## Enemy loop

### Spam Bot
- [x] patrol
- [ ] detect
- [ ] paper/spam attack
- [x] hit
- [x] defeat

### Scooter
- [x] fast patrol
- [ ] readable warning
- [x] stomp/avoid interaction
- [x] defeat

### Spy Drone
- [x] air patrol
- [ ] detection cone / attack window
- [x] hit
- [x] defeat

## Checkpoint / finish
- [x] visible checkpoint terminal
- [ ] checkpoint activation VFX
- [x] visible finish gate / portal
- [x] finish interaction feedback
- [x] no level completion without reaching visible finish object

## P1 acceptance gate
- [ ] Мінімум 3 відчутні abilities/power-ups у 01-01
- [ ] Верхній маршрут має gameplay-причину
- [ ] Enemy telegraph/readability нормальна
- [ ] Player state transitions читабельні
- [x] Checkpoint і finish повністю видимі технічно

---

# P2 — LEVEL ART / ROUTES / POLISH

Issue: #6
Blocked by: P0 + P1

## Environment modules
- [ ] road variants
- [ ] sidewalk variants
- [ ] curbs
- [ ] benches
- [ ] planters
- [ ] street lamps
- [ ] trash bins
- [ ] bus stop
- [ ] bus-stop roof traversal surface
- [ ] stairs
- [ ] ramps
- [ ] bridge
- [ ] parapets
- [ ] PerkUp pavilion
- [ ] CHARME storefront/workshop
- [ ] ХБ billboard / info kiosk
- [ ] construction barriers
- [ ] scaffold
- [ ] crane/background construction
- [ ] park trees / shrubs / flowerbeds
- [ ] water edge / reeds

## Hazards
- [ ] visible pit/trench
- [ ] water/fall hazard
- [ ] construction hazard
- [ ] spam projectile zone
- [ ] drone pass/attack zone
- [ ] readable recovery/safe zones

## Routes
- [ ] main route
- [ ] upper route
- [ ] secret entrance
- [ ] underground route setup
- [ ] optional shortcut
- [ ] collectible chains guide route choice

## Composition / polish
- [ ] foreground layer
- [ ] midground gameplay layer
- [ ] background skyline layer
- [ ] parallax
- [x] contact shadows under characters
- [x] consistent scene scale — first P0 pass
- [x] pickup feedback — basic
- [ ] checkpoint VFX
- [ ] finish VFX
- [ ] no pasted-sticker look — needs visual review
- [ ] no empty gameplay stretches without purpose

## Brand integration rule
PerkUp, CHARME і «Не Ху#ові Бровари» працюють як місця/об'єкти/механіки світу, а не як рекламні HUD-банери.

## P2 acceptance gate
- [ ] Кожен екран має зрозумілий gameplay path
- [ ] Немає floating abstract platforms
- [ ] Main/upper/secret route читаються візуально
- [ ] Brovary identity інтегрована в середовище
- [ ] Level виглядає як одна безперервна міська сцена

---

# Build policy

## Dev build
Може містити debug overlays, collider view, FPS і trigger diagnostics.

## Review build
Не може містити debug geometry або placeholder sprites. P0 review-build використовується тільки для acceptance-тесту; production vertical-slice статус даємо після закриття gate.
