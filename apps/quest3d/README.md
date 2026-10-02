# P-BOT Coffee Quest — independent 3D chapter

Playable vertical slice of **01-01 / Ранок без сигналу**. Separate Vite application; no changes to the existing 2D web app, its server, API, Railway configuration, or deployment. This is not CHARME launch work or VZUI. No real loyalty, discounts, payments, credentials or external services.

## Run

From repository root (Node 22+):

```sh
npm ci --ignore-scripts
npm --workspace apps/quest3d run dev
# http://127.0.0.1:4317 — strict port, loopback only
npm --workspace apps/quest3d run build
node --test apps/quest3d/tests/state.test.mjs apps/web/tests/story-core.test.mjs
npx playwright install chromium webkit
node apps/quest3d/tests/playthrough.mjs
node apps/quest3d/tests/runtime.mjs
```

Build output is `apps/quest3d/dist`, a standalone static site. It is not deployed. Existing 2D remains at https://web-production-f3e45.up.railway.app/. Do not replace that deployment with this build. `CHROMIUM_PATH` / `WEBKIT_PATH` optionally use existing compatible browser executables.

## Shipped scope

- Authored first-chapter quest rules reuse the unchanged pure `apps/web/public/story-core.js`. PerkUp accept/8 beans/return, NEWS accept/3 unique shards/return, CHARME accept/scaffold parcel/return, explicit terminal activation, Perky portal turn-in.
- Rapier capsule controller, camera-relative WASD/arrows, double jump, crouch with resized collider/standing clearance, SPAM drones with contact damage/stomp/Pulse, two checkpoints, three hearts and respawn.
- Camera orbit via drag and R reset; camera shells prevent building/scaffold occlusion. DOM menus/dialogs pause simulation, retain native modal keyboard focus, clear held movement and pause on focus loss.
- Touch directional pad, jump, Pulse, crouch, camera reset and contextual interaction. Landscape and portrait emulation checked; no claim of physical iPhone validation.
- P-BOT procedural model follows original black hoodie, gold headphones, cyan face/tuft reference. Brovary Hero and Vitalii are separately selectable and saved but share the procedural human mesh, consistent with the duplicated source art noted in WORLD01_STORY.md. Distinct final human art remains work.
- 24 beans in this compact slice, 1 street token, 3 one-time quest tokens and 2 completion tokens; speed/jump/Pulse upgrades; grip reward increases braking. Three-star scoring (finish/all beans/no damage) and best time. Replay retains bank, receipts, upgrades, stars and best, preventing reward farming.
- `pbot-brovary-3d-v3` is the only written storage key. Resume restores quest/inventory at the latest safe checkpoint. Optional import copies **only character selection** from `pbot-brovary-final-v1`; 2D progression/currency/coordinates are intentionally not transferred or modified. Storage failure reports session-only progress. Invalid values are sanitized.
- WebGL boot failure/context loss presents reload and 2D fallback, including when a modal was open. No networking/API gameplay dependency.

## Architecture and assets

`state.js`: pure quest adapter, save sanitation, reward receipts, upgrade economy. `main.js`: fixed 60 Hz Rapier simulation, action input, DOM adapters, camera and lifecycle. `art.js`: chapter render adapter; `plaza.js`: modeled PerkUp courtyard and static batching; `characters.js`: articulated procedural actors; `particles.js`: pooled pickup/landing effects. Units are meters; +Y up, +Z route direction, actor origin at feet. Static box collision proxies cover building shells and scaffold. Cosmetic street fixtures have no gameplay collisions. No purchased/generated/downloaded art; all 3D geometry is authored here. Three.js (MIT), Rapier (Apache-2.0), Vite/Playwright toolchain remain under their upstream licenses.

## QA interpretation

`playthrough.mjs` completes the actual quest in Chromium then WebKit, uses UI dialogs and deterministic movement/jump/Pulse inputs through the same simulation, accelerates traversal with a development-only fixed-step hook, and never teleports or grants items. Production builds do not expose the hook. It checks reload, legacy save bytes, replay, modal/context fallback, and touch-sized layouts. `runtime.mjs` separately uses real timed physical keyboard events for movement/double jump/crouch, measures 180 real animation frames, and exercises unavailable storage/WebGL. Screenshots and JSON go to ignored `qa-3d/`; CI publishes an artifact for the tested SHA.

This is a playable, procedurally illustrated vertical slice, not final character/environment art or a 45-level conversion. Local warm desktop results are not low-end/mobile GPU or network guarantees. Rapier's embedded WASM is ~831 kB gzip and triggers Vite's size warning; cold network/device budgets need future work. The V2 PerkUp capture spans approximately 140–770 draw calls depending on camera direction; later streets still use the earlier rendering. Local desktop Chromium measured p50 8.3 ms / p95 9 ms over 180 warm frames. These numbers are not physical mobile validation or a whole-route performance guarantee.

## Next conversion plan

1. Obtain user direction approval from the V2 actual gameplay video before spreading the PerkUp visual treatment. Refine foot contact/anticipation, bean silhouettes, courtyard edges and paving composition; then distinct Brovary Hero/Vitalii, expressive NPCs, remaining landmarks and authored audio.
2. Production-readiness pass: instance repeated street/window geometry, low-quality toggle, separate WASM loading/caching budget, physical Android/iOS testing, GPU context restore soak, accessibility/user playtest.
3. Author 01-02 «Паркові стежки»: specify narrative and spatial encounter design before implementing traversal and quest content; retain v3 save migration tests.
4. Port further chapters in individually reviewed slices with browser completion, screenshots, frame/load budgets and save compatibility. The original 45 map entries are not 45 authored chapters; no claim that the other 44 are complete.
5. Only after user acceptance choose a separate hosting target/domain and deployment plan. This PR must not replace or auto-deploy over 2D production.

## V2 visual direction checkpoint

The opening PerkUp area (first ~26 meters) now has modeled arches, roofs, striped awnings, a cup sign, patio furniture, planters, lanterns and instanced paving. P-BOT has rounded articulated limbs, alternating procedural IK steps, torso lean, blinking, airborne poses and landing effects. A closer third-person camera preserves the chapter's mechanics. The rest of the route remains the original 3D prototype, deliberately awaiting direction approval.

`tests/capture-motion.mjs` records ~16 seconds of ordinary Playwright keyboard/pointer gameplay: idle, run/turn, PerkUp acceptance, collection, double jump/landing, camera orbit and Pulse. It never teleports or accelerates simulation. Output `qa-visual-v2/final/` is ignored; use `CAPTURE_OUT` to choose another directory. The video and three screenshots were delivered privately through Library as `PBOT-3D-V2-*`. Touch evidence is browser emulation, not physical iPhone testing.

Independent visual review compared the old scene with four new screenshots, 12 extracted video frames and the rig implementation. Verdict: substantial improvement suitable to show as a direction preview, **not final visual acceptance**. Remaining findings: repetitive paving and background shrubs, empty orbit edges, generic NPC proportions, egg-like bean silhouettes. Local sinusoidal IK does not world-lock feet; foot sliding and continuous animation timing remain for further review. Takeoff compression currently follows the input rather than anticipating it. User approval of the direction remains open.
