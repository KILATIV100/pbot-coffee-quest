# Stage 2 Production Spec — WORLD 01 / LEVEL 01

## Identity
- World: **01 — Розвилка**
- Level: **01-01 — Місто прокидається**
- Orientation: **landscape-only**
- Logical viewport: **960×540**
- Target level width: **7,200–8,400 logical px**
- Expected first-clear time: **4–6 minutes**

## Core rule
The player must see a believable continuous Brovary-inspired street/park route. The engine may use simple collision geometry internally, but visible gameplay is built from environment assets, not abstract platforms.

## Camera
- Player forward-running anchor: x = 32–38% of screen.
- Right side remains open for anticipation and route reading.
- Camera look-ahead increases slightly with speed.
- Camera should not snap vertically for small height changes.
- Upper and main routes must remain readable in one 16:9 composition where possible.

## Route structure
The level contains three connected route families.

### MAIN ROUTE
Accessible and readable. Teaches all core controls and guarantees level completion.

### UPPER ROUTE
Higher-risk traversal using stairs, roofs, bus-stop canopy, bridge/scaffolding and ladders. Contains extra tokens/boosts and avoids selected ground hazards.

### SECRET / UNDERGROUND ROUTE
Optional route accessed through a hatch/door after an intel cue. Uses tunnel/utility-space art, lower lighting and compact enemy encounters. Returns to main route before the final section.

## Zone layout
### Z0 — START / Morning Street
Approx. x 0–900.
- Safe spawn area.
- Movement/jump tutorial through Perky.
- Benches, planter, railing, morning skyline.
- 3–5 coffee beans.
- No lethal threat for first screen.

### Z1 — PerkUp Block
Approx. x 900–1,900.
- PerkUp kiosk/shop is a natural landmark.
- First Nitro boost introduction.
- First small gap / cracked pavement.
- GROUND Spam Bot introduced with safe stomp setup.
- Optional beans on bus-stop roof establish upper-route language.

### Z2 — Transit / Bus Stop
Approx. x 1,900–3,000.
- Bus stop + city bus + street furniture become traversal geometry.
- FAST Scooter introduced with long telegraph.
- Upper route: shelter roof → bus → stair/bridge connection.
- First checkpoint near zone exit.

### Z3 — CHARME Mobility Block
Approx. x 3,000–4,050.
- CHARME storefront is a major readable landmark.
- Speed Shoes introduction.
- Mixed main/upper route with stairs and awning/roof surfaces.
- AIR Spy Drone introduced.
- One Brovary token placed on upper route.

### Z4 — Intel / Secret Entrance
Approx. x 4,050–5,000.
- News/intel terminal cues hidden route.
- RANGED Paper Shooter introduced on main route.
- Secret hatch becomes accessible after scan/intel interaction.
- Main route continues; secret route drops underground.

### Z5 — Underground Utility Route
Parallel route approx. x 4,350–5,750.
- Tunnel, pipes, ladders, water channels, maintenance walkway.
- Short hazard rhythm: water edge → ranged projectile → moving cart.
- Secret collectible/token.
- Kessi Sense can highlight bonus niche.
- Exit ladder/door reconnects before construction zone.

### Z6 — Construction / Heavy Encounter
Approx. x 5,000–6,650.
- Scaffolding, barriers, roadworks pit, ramp, retaining wall.
- HEAVY Municipal Bot introduced as a mini encounter.
- Upper route across scaffolding gives avoidance/bonus option.
- Second checkpoint after heavy encounter.

### Z7 — Rozvylka Finale
Approx. x 6,650–8,000.
- Wider, more open final composition.
- Combines one FAST or AIR threat with environmental hazards.
- Route converges toward finish landmark.
- Finish gate visible before player reaches it.
- Clear result triggers Perky success animation and level-complete UI.

## First-level enemy budget
Keep density low enough for visual readability.
- Spam Bot: 3–5
- Scooter: 2–3
- Spy Drone: 2–3
- Paper Shooter: 2
- Municipal Bot: 1 main encounter

No boss fight in 01-01.

## Collectible budget
- Coffee beans: 35–50
- Brovary tokens: 3
- Intel/news collectible: 1–2
- PerkUp Nitro: 1 guaranteed + optional refill
- CHARME Speed Shoes: 1 guaranteed introduction
- Kessi token: 1 optional introduction or teaser

## Checkpoints
- CP1: after Transit zone.
- CP2: after Construction heavy encounter.

Checkpoint must be visible, unmistakable and placed on safe ground.

## Collision policy
Each visible module declares one or more simple collision shapes:
- `solid_rect`
- `one_way_rect`
- `slope`
- `hazard_rect`
- `trigger_rect`
- `moving_rect`

Examples:
- bench → solid_rect
- bus-stop roof → one_way_rect
- stair/ramp → slope or stepped solids
- water edge → hazard_rect
- secret hatch → trigger_rect
- maintenance cart → moving_rect

## Art layers per zone
Each zone should be assembled from:
1. Far skyline
2. Midground panorama
3. Traversable terrain/buildings
4. Collision props
5. Hazards/interactables/enemies
6. Foreground dressing

Avoid baking enemies, collectibles, checkpoints or gameplay-critical hazards into the background panorama.

## Stage 2 implementation order
1. Export/clean all approved characters and NPC references.
2. Split enemy and environment sheets into transparent runtime assets.
3. Build `asset-manifest.json` with IDs, dimensions, anchors and collision metadata.
4. Produce 3–4 parallax background families for World 01.
5. Build Level 01-01 blueprint using the seven zones above.
6. Implement landscape 960×540 runtime and portrait rotate prompt.
7. Implement modular terrain/collision renderer.
8. Add three-route level data.
9. Integrate enemies/boosts/checkpoints.
10. Run mobile Safari + desktop playtest.
11. Only after QA, publish updated production build.

## Definition of Done for Stage 2 / Level 01-01
- Entire level playable from start to finish in landscape.
- No abstract visible platforms.
- Main, upper and underground routes all functional.
- All five enemy archetypes represented or intentionally deferred with documented reason; HEAVY appears once.
- P-BOT, Perky and used NPC/ally assets render with clean alpha.
- Two checkpoints work.
- Collectibles and both sponsor-linked boosts work.
- No hostile asset contains official state symbolism.
- Stable 60 FPS target on modern mobile hardware under normal load.
- Visual composition matches the approved polished game-art direction.
