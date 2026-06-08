# QA Checklist: Pac-Map

Use this checklist before packaging a release or after larger gameplay changes.

## Automated Checks

- [ ] Run `npm.cmd test`.
- [ ] Run `npm.cmd run typecheck`.
- [ ] Run `npm.cmd run lint`.
- [ ] Run `npm.cmd run build`.
- [ ] Confirm the test count includes parser, movement, collisions, scoring, lives, power mode, session, AI, ranking, audio, SVG skin registry, render smoke tests and game loop coverage.

## Desktop Smoke Test

- [ ] Start the game from the idle screen with Space.
- [ ] Start the game from the idle screen with the Start game button.
- [ ] Move with arrow keys.
- [ ] Move with WASD.
- [ ] Verify Pac-Map cannot move through walls.
- [ ] Verify pause toggles with `P` and `Escape`.
- [ ] Verify audio toggles with `M` and the HUD Audio button.
- [ ] Verify the selected ghost skin is visible after changing it on the start overlay.
- [ ] Verify score, lives, level and mode update without overlapping HUD text.

## Gameplay Flow

- [ ] Collect a regular pellet and confirm score increases by 10.
- [ ] Collect a map bonus object and confirm score increases by 30.
- [ ] Collect a QGIS power logo and confirm money bags enter red frightened mode.
- [ ] Eat a frightened ghost and confirm the ghost returns to spawn.
- [ ] Wait 10 seconds after eating a ghost and confirm it returns to normal play.
- [ ] Collide with a normal ghost and confirm one life is lost.
- [ ] Lose the final life and confirm Game over appears.
- [ ] Submit a ranking entry with name and phone number.
- [ ] Restart after Game over and confirm the selected skin remains active.
- [ ] Finish a level and confirm the next-level overlay appears.
- [ ] Complete level 3 and confirm the victory state appears.

## Desktop And Visual Checks

- [ ] Check desktop viewport around `1280x900`.
- [ ] Optionally check compact viewport around `390x844`.
- [ ] Confirm the board remains visible and centered.
- [ ] Confirm HUD cards stay readable in the supported desktop window range.
- [ ] Confirm overlay buttons do not overlap.
- [ ] Confirm the game remains readable with current code-generated SVG assets.
- [ ] Confirm reduced-motion mode disables nonessential animations.

## Notes

- There is currently no separate Zustand game store. Game session state is local to `GameScreen`, while deterministic gameplay rules are covered by engine and session tests.
- Keep engine modules free from browser-only APIs. Audio, local storage and DOM behavior should stay in renderer or adapter modules.
