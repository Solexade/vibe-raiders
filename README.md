# Vibe Raiders — Colourful Survival

An independent browser fan game with a bright cream, mint, lavender, and coral website and a colourful first-person raycast arena. Four selectable character portraits come from the user-requested [vibe vibers Raiders collection](https://testnet.vibevibe.fun/vibe-vibers/for-raiders). Original nicknames identify the characters in this game. Artwork is stored locally, unchanged, and attributed in [assets/ATTRIBUTION.md](assets/ATTRIBUTION.md). No official affiliation is claimed.

The Atlas World Quest reference was inaccessible during this update. The bright layout is an original implementation based on the requested colourful direction, not a copy of that site's template.

## Play locally

Run `python3 -m http.server 8000` in this directory and open `http://localhost:8000`.

- WASD / up-down arrows: move; mouse or left-right arrows: turn.
- Shift: sprint. Click or hold mouse / Space: fire.
- 1: pulse blaster — steady single energy shots.
- 2: vibe rifle — rapid fire with slight spread.
- 3: boom shotgun — seven-pellet spread, shorter range, slower firing.
- Escape or Pause: pause; Resume continues; Back to the Crew returns to character selection.
- Touch movement, firing, pause, and weapon buttons appear on mobile.

Clear enemy waves to progress. Each takedown restores 3 shield. Weapon selection changes behaviour and the first-person weapon drawing. Character selection changes the hero portrait and player identity; it does not change combat statistics. Enemies display the collection artwork on floating collectible-style panels inside the raycast arena. Music and firing SFX are synthesized locally after user interaction; the header button mutes all audio. Best scores use local browser storage when available.

No packages, build step, backend, external fonts, wallet, or credentials are required. Python and Chromium are only used for local development and validation.

## Deploy to Netlify

Import this GitHub repository into Netlify. Leave the build command empty and set the publish directory to `.`. `netlify.toml` supplies the publish setting. Alternatively, download the repository ZIP, extract it, and drag its contents into Netlify Drop. The root entry point is `index.html`; the original calendar remains at `orange-dynasty-calendar.html`.

## Validation

Chromium checks cover artwork loading, character selection, desktop/mobile layouts, all three weapons' damage and cooldowns, shotgun range, wave progression, pause/resume, death/restart, returning to selection, and muting. No browser JavaScript errors were observed in the verified flows.
