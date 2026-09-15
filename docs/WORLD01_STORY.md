# World 01 — Story & Actors 03

Scope: level **01-01**, preserving the approved World 01 scenery. This update adds a playable first chapter; it does not claim that the remaining 44 levels have authored narrative or finished animation.

## Chapter: Ранок без сигналу

The city terminals have lost their signal. Perky sends the player to the neighbours rather than directly to a finish line. Three explicit accept → collect → return → turn-in missions prepare the terminal:

1. **PerkUp / Заряд для міста** — talk to the barista, collect eight coffee beans, return and receive a fictional energy charge. Previously collected beans count; the collectible score is not spent.
2. **NEWS / Повідомлення у шумі** — accept the search, find three unique fragments around the bridge, return to the editor. The restored message is signed THE OFFICIAL and supplies the route code.
3. **CHARME / Посилка для CHARME** — retrieve the parcel from the scaffold by climbing the planters and crates, then bring it back to the craftsman. The grip module improves braking in this level.
4. **Terminal and exit** — explicitly activate the second-checkpoint terminal, then speak to Perky at the portal to complete the chapter. The next-level transition remains 01-02 / Паркові стежки.

NPCs give different replies before acceptance, while an objective is incomplete, when the item is ready to turn in and after completion. The player may postpone an offer. This is a linear introductory chapter, not a branching-dialogue campaign.

## Controls and game state

- F: contextual conversation / interaction, using physical keyboard codes so Ukrainian layouts work.
- J: quest journal. Escape closes dialogs/journal. Tab remains inside modal controls.
- E: existing Perky Pulse; interaction does not replace the combat action.
- Touch: contextual talk/terminal/portal button and a tappable objective tracker.
- Dialogs pause simulation and clear held movement. Quest markers and the objective tracker remain lightweight during normal movement.

## Persistence and rewards

The existing `pbot-brovary-final-v1` save remains in use. `storyRun` adds a sanitized quest snapshot, safe standing position, checkpoint flags, collected-item indices, defeated enemies, time and damage. Loading resumes the chapter without replacing older campaign progress. Completion clears the active chapter snapshot.

`questRewards` is a set of one-time receipts for coffee/news/shoes. Each mission pays one **in-game** token once, including across reloads and replays. No blockchain, external payment, real discount or business loyalty integration is provided.

## Actor repair

`actors-v3.js` prepares fixed 192×224 canvases from intact, already committed owner references. It removes edge-connected matte and small detached fragments, aligns frames at a shared foot anchor, mirrors around that anchor and selects idle/run/jump/fall/crouch/hurt/finish explicitly. Preparation occurs once at load, not every animation frame.

P-BOT reuses its original illustrated poses. The human has a basic articulated cutout cycle and a native bent pose. **Brovary Hero and Vitalii currently share the repaired black-clothes reference**, matching the duplicated source available in this build; a different NPC has not silently been relabelled as Vitalii. This is not a newly hand-drawn, character-specific animation production pack. Separate human identities, additional hand-drawn in-betweens and expressive NPC motion remain art tasks.

## Tests

- `node --test apps/web/tests/story-core.test.mjs`: ordered transitions, prerequisites, uniqueness, immutable input, duplicate reward prevention and save sanitation.
- `apps/web/tests/story-browser.mjs`: real Chromium UI for dialog choices, keyboard, touch-sized controls, journal, reload and chapter ending; long route traversal is accelerated with normal deterministic simulation input, not teleporting or granting quest items.
- `apps/web/tests/actor-visual.mjs`: actual renderer contact sheet for all selectable actors and states, alternating facing directions, non-empty silhouettes and canvas-bound checks.

Browser tests use desktop 1440×900 and touch-emulated 844×390, capture screenshots and report errors. This is not a physical iPhone/Safari test, a complete 50/50 collectible-route certification or a full-campaign playthrough. Production deployment and served build identity are verified separately from CI.
