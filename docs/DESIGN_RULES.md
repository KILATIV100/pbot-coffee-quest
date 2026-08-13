# P-BOT: Brovary Universe — Design Rules

## Product lock: landscape-first

The game is designed as a horizontal side-scroller. Gameplay must be presented in landscape orientation only.

### Viewport
- Primary aspect ratio: 16:9.
- Reference logical viewport: 960×540.
- Mobile gameplay: landscape orientation.
- Desktop/tablet: preserve 16:9 gameplay viewport without stretching.
- Portrait mobile view should show a rotate-device prompt instead of compressing gameplay.

### Why landscape is mandatory
- Brovary environments are built as long continuous streets, parks, bridges and urban routes.
- The player must see upcoming enemies, hazards, collectibles and alternative routes early enough to react.
- Upper routes, secret zones and underground paths must remain readable in one composition.
- Sponsor locations and recognizable Brovary scenery should feel like part of the city rather than UI banners.

## Level composition rule

The city itself is the platforming geometry. Do not use abstract floating rectangles as visible platforms.

Use real-world geometry such as:
- sidewalks and curbs;
- benches and flowerbeds;
- bus-stop roofs;
- buses and kiosks;
- stairs and ramps;
- bridges and retaining walls;
- shop roofs and awnings;
- trees and construction structures;
- tunnels, hatches and underground utility spaces.

Collision surfaces may be rectangular internally, but the player must only see believable environmental assets.

## Screen-space composition
- Keep the main player in the left 30–40% of the screen during forward movement.
- Reserve the right 60–70% for anticipation: enemies, hazards, collectibles and route choices.
- HUD stays on the outer safe-area edges and must not cover the traversal path.
- Touch controls stay in the lower corners and should not obscure hazards or collectibles.

## World art pipeline
Each level is assembled from multiple art layers and modular assets:
1. Far background / skyline.
2. Midground city or park panorama.
3. Traversable environment modules.
4. Foreground dressing.
5. Gameplay objects: hazards, enemies, collectibles, boosts, checkpoints and finish gates.
6. Optional upper-route and secret underground layers.

This landscape-first rule applies to all 15 worlds and all future level art, UI and gameplay implementation.
