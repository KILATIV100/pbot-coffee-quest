# P-BOT: Brovary Universe — Asset Manifest v1.0

Status: Stage 2 production checklist.

## Runtime format rules
- Gameplay orientation: landscape 16:9.
- Reference logical viewport: 960×540.
- Source art: PNG at production resolution.
- Runtime: WebP with alpha where quality is acceptable; PNG where edge quality requires it.
- No chroma-key backgrounds in runtime assets.
- Every gameplay sprite requires stable anchor/baseline metadata.
- All filenames: lowercase ASCII kebab-case.

## Folder target
```text
assets/
  characters/
    pbot/
    perky/
    kessi/
    vitalii/
    marina/
    dimon/
    charme-master/
    semkych/
  enemies/
    spam-bot/
    scooter/
    spy-drone/
    paper-shooter/
    municipal-bot/
  bosses/
    the-official/
    bureaucracy-bulldozer/
  worlds/
    world01/
      backgrounds/
      midground/
      terrain/
      props/
      hazards/
      interactables/
      collectibles/
      boosts/
      checkpoints/
      secrets/
      foreground/
  ui/
    hud/
    prompts/
    icons/
```

## Character deliverables
### P-BOT
- idle: 1–2
- run: 6–8
- jump: 1–2
- fall: 1–2
- crouch: 1–2
- land: 2–3
- stomp: 2–4
- hit: 2–3
- victory: 2–4

### Perky
- hover-idle: 2–4
- fly: 4–6
- point: 2–3
- scan: 4–6
- alert: 2–3
- happy: 2–3
- hologram/hack: 4–6
- damaged: 2–4

### Kessi
- idle/alert: 2–4
- run: 6–8
- leap: 2–4
- rush attack: 4–6
- search/sniff: 3–5
- bark: 2–3
- success/sit: 2–3
- hit/dizzy: 2–4

### Hub NPCs
Vitalii, Marina, Dimon and CHARME Master each require 6–8 static/limited-animation dialogue poses and one portrait crop.

### Semkych
- idle
- walk/run
- wind-up
- seed throw
- jump
- trap setup
- phase change
- hit
- defeated

## Enemy deliverables
Each enemy archetype requires at minimum: idle/patrol, primary action, hit and defeated.

### GROUND / Spam Bot
Patrol, turn, attack/pressure, stomp-hit, defeated.

### FAST / Scooter
Idle/ready, drive loop, boost, crash/defeated.

### AIR / Spy Drone
Hover, patrol, scan-cone, alert, damaged, defeated.

### RANGED / Paper Shooter
Idle, aim, paper-burst, reload/cooldown, hit, defeated.

### HEAVY / Municipal Bot
Idle, walk, guard, charge, shield impact, stagger, defeated.

## Main boss deliverables
### The Official + Bureaucracy Bulldozer
- intro/arrival
- combat idle
- loudspeaker shockwave
- barrier launcher
- drone bay open/launch
- giant stamp wind-up
- giant stamp impact
- shredder active
- damaged phase
- defeated
- 3/4 showcase and side-view reference

## WORLD 01 — Environment kit
### Background layers
- `w01-bg-skyline-a`
- `w01-bg-skyline-b`
- `w01-mid-park-a`
- `w01-mid-city-a`
- `w01-mid-construction-a`
- `w01-secret-underground-a`

### Traversable terrain
- sidewalk long / medium / short
- curb straight / edge / corner
- cracked sidewalk
- stairs up/down
- ramp
- stone bridge
- retaining wall
- shop roof/awning surfaces
- bus-stop roof
- scaffolding walkway
- tunnel entrance
- underground walkway

### Props
- bench
- planter variants
- streetlight
- railing variants
- bus stop
- city bus
- PerkUp kiosk/shop module
- CHARME shop module
- news terminal/kiosk
- construction barrier
- scaffold
- ladder
- tree variants
- bushes/flowers
- drain/manhole

### Hazards
- ground gap
- water edge
- cracked pavement
- spike/metal hazard
- roadworks pit
- temporary barrier
- moving maintenance cart

### Interactables / secrets
- breakable crate
- smart-city terminal
- secret hatch
- secret door
- upper-route ladder
- underground entrance

### Collectibles
- coffee bean
- Brovary token
- intel/news collectible

### Boosts
- PerkUp Nitro
- CHARME Speed Shoes
- Kessi summon token / paw token

### Progress objects
- checkpoint post
- finish gate
- route marker

## Layering order
1. far skyline
2. midground city/park
3. traversable terrain and buildings
4. collision props
5. gameplay objects / enemies
6. player / companions
7. foreground dressing
8. HUD

## Acceptance criteria before engine integration
- alpha visually checked on light and dark backgrounds
- no baked background rectangles
- no clipped limbs/effects
- consistent scale between all characters
- stable baseline across animation frames
- no state symbols on hostile units
- filenames and IDs match manifest
- every collision-bearing asset has a documented collision shape
