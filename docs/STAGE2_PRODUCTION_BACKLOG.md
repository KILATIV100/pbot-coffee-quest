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
- [ ] P-BOT: true alpha, без чорного/світлого фону, без ореолів
- [ ] Perky: true alpha, consistent crop/anchor
- [ ] Spam Bot: true alpha, consistent crop/anchor
- [ ] Scooter: true alpha, consistent crop/anchor
- [ ] Spy Drone: true alpha, consistent crop/anchor
- [ ] Єдиний baseline/scale policy для hero / companion / enemy
- [ ] Sprite cells не можуть містити фон сцени або прямокутну підкладку

## P-BOT animation states
- [ ] idle
- [ ] run
- [ ] jump-start
- [ ] jump-air
- [ ] fall
- [ ] land
- [ ] crouch — окремий sprite/state, НЕ scale-down
- [ ] hit
- [ ] victory

## Collision / trigger cleanup
- [ ] Перерахувати player hitbox окремо від sprite bounds
- [ ] Окремий crouch hitbox
- [ ] Невидимі legacy finish/win triggers видалити
- [ ] Невидимі legacy checkpoint triggers видалити
- [ ] Невидимі debug collision surfaces видалити або прив'язати до видимих об'єктів
- [ ] Кожен trigger повинен мати видиму ігрову причину
- [ ] Перевірити spawn / respawn / camera bounds

## P0 acceptance gate
- [ ] Немає чорних/білих прямокутників навколо sprites
- [ ] Crouch виглядає як окрема поза
- [ ] Немає невидимої перемоги / телепорту / checkpoint
- [ ] Hitbox візуально відповідає персонажу
- [ ] Mobile Safari landscape test пройдено
- [ ] Desktop Safari/Chrome test пройдено

---

# P1 — GAMEPLAY & ABILITIES

Issue: #5
Blocked by: P0 / #4

## Core controller
- [ ] run acceleration/deceleration
- [ ] variable jump
- [ ] coyote time
- [ ] jump buffer
- [ ] double jump
- [ ] crouch
- [ ] stomp
- [ ] hit / knockback / invulnerability

## Power-ups / суперсили

### PerkUp Nitro
- [ ] pickup object
- [ ] speed boost
- [ ] jump boost
- [ ] timer
- [ ] VFX / trail
- [ ] HUD indicator
- [ ] pickup feedback

### Double Jump Module
- [ ] collectible/module
- [ ] unlock upper route
- [ ] distinct air VFX
- [ ] second-jump animation cue

### CHARME Speed Shoes
- [ ] pickup
- [ ] speed/mobility modifier
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
- [ ] patrol
- [ ] detect
- [ ] paper/spam attack
- [ ] hit
- [ ] defeat

### Scooter
- [ ] fast patrol
- [ ] readable warning
- [ ] stomp/avoid interaction
- [ ] defeat

### Spy Drone
- [ ] air patrol
- [ ] detection cone / attack window
- [ ] hit
- [ ] defeat

## Checkpoint / finish
- [ ] visible checkpoint terminal
- [ ] checkpoint activation VFX
- [ ] visible finish gate / portal
- [ ] finish interaction feedback
- [ ] no level completion without reaching visible finish object

## P1 acceptance gate
- [ ] Мінімум 3 відчутні abilities/power-ups у 01-01
- [ ] Верхній маршрут має gameplay-причину
- [ ] Enemy telegraph/readability нормальна
- [ ] Player state transitions читабельні
- [ ] Checkpoint і finish повністю видимі

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
- [ ] contact shadows under characters
- [ ] consistent scene scale
- [ ] pickup VFX
- [ ] checkpoint VFX
- [ ] finish VFX
- [ ] no pasted-sticker look
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
Не може містити debug geometry або placeholder sprites. Показуємо тільки після P0 gate.

## Production build
Потребує P0 + P1 + P2 acceptance, mobile Safari test, desktop test і Railway public smoke test.

---

# Order of execution

1. P0 sprite cleanup
2. P0 crouch + hitboxes
3. P0 trigger cleanup
4. P0 QA
5. P1 abilities
6. P1 enemy state machines
7. P1 checkpoint/finish
8. P1 QA
9. P2 environment kit
10. P2 routes/hazards
11. P2 polish/parallax/VFX
12. full 01-01 review build
