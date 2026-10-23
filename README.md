# Vibe Raiders — 3D Playground

A standalone, true 3D browser survival game built with Three.js. The bright cream, mint, lavender, and coral landing page keeps the original collection portraits. The arena uses perspective WebGL rendering, real mesh geometry, lighting, soft shadows, collision, and raycast shooting.

## What's in the arena

- A grassy outdoor arena inspired by the approved mockup: individual grass blades, wildflowers, dirt lanes, worn entry paving, moss accents, timber fencing, trees, rolling hills, a village, and an animated windmill. The square perimeter, four original cover columns, movement boundaries, and open combat lanes are preserved. Scenery beyond the boundary is decorative; ground plants do not block movement or shots. Static repeated scenery is instanced, with fewer plants and trees on mobile.
- Four original voxel interpretations of the collection characters: glowing eyes, walking limbs, different hats/antennas, a rotating propeller, and elite variants joining from wave 3, with more elites every 3 waves. These are procedural fan-game models, not official 3D collection assets.
- Three detailed first-person weapons, hand/sleeve models, recoil, muzzle flashes, tracers, aiming, magazines, and reload animations.
- A pulse blaster (16 rounds), automatic rifle (30 rounds), and eight-pellet shotgun (6 rounds, shorter range). Reserve ammo is unlimited; empty weapons reload on the next firing attempt.
- Shield recovery on takedowns, wave-clear bonuses, local best score, and desktop/touch controls.
- Locally synthesized music with bass, percussion, melody, and chords, plus distinct weapon sounds, reloads, footsteps, hits, damage, and wave cues. Music and effects have independent volume sliders under **MIX**; the sound button mutes both. Audio begins only after interaction.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | WASD / up-down arrows | Direction buttons |
| Look | Mouse (click arena to capture) / left-right arrows | Drag the arena |
| Fire | Hold left click / Space | Hold FIRE |
| Aim | Hold right click | Toggle AIM |
| Switch weapon | 1 / 2 / 3 | Weapon buttons |
| Reload | R | Reload button |
| Sprint | Shift | — |
| Hop | E | HOP |
| Pause | Escape | Pause button |

Select a character on the landing page to change player identity and sleeve colours. Character selection does not change combat statistics. **Back to the Crew** returns to selection.

## Run and deploy

No package installation, build, API key, wallet, external font, or remote asset server is required at runtime. Three.js 0.180.0 is vendored locally with its MIT license. A current browser with WebGL 2 is required; a clear error appears if graphics initialization fails.

For local development, run `python3 -m http.server 8000` in this directory and open `http://localhost:8000`. ES modules require HTTP serving; opening `index.html` directly from a file manager is not supported.

For Netlify, import this repository, leave the build command empty, and set the publish directory to `.`. `netlify.toml` contains the publish setting. Alternatively, extract the GitHub download ZIP and drop the extracted folder into Netlify Drop. The original calendar is preserved at `orange-dynasty-calendar.html`.

## Artwork and dependencies

Original portrait PNGs are from the user-requested [vibe vibers Raiders collection](https://testnet.vibevibe.fun/vibe-vibers/for-raiders). Sources and attribution are in [assets/ATTRIBUTION.md](assets/ATTRIBUTION.md). Character nicknames are original fan-game labels; no official affiliation or artwork ownership is claimed. The Atlas reference was inaccessible, so the bright website is an original implementation of the user's colourful direction.

Three.js 0.180.0's browser module and core module were obtained from the official npm package. Its MIT license is in [vendor/THREE-LICENSE.txt](vendor/THREE-LICENSE.txt).

## Validation

`tests/browser-check.py` uses Python Playwright and installed Chromium. With the static server running, use `RAIDERS_URL=http://127.0.0.1:8000 python3 tests/browser-check.py`. Its isolated test hooks are added by browser routing, never to the shipped game. The checks exercise real 3D ray hits, all weapons and reloads, wall occlusion, shotgun range, auto fire, aiming, hopping, collision, waves/elites, character selection, pause/restart, audio output and mixing, and mobile touch interaction. Software WebGL in headless Chromium can run more slowly than a hardware-accelerated browser.

## Wave difficulty

Difficulty is defined in `difficulty.js` and increases automatically with every wave. Regular health gains 7 points per wave; elite health gains 13. Enemy numbers rise to a maximum of 24, movement speed rises to a bounded maximum, damage increases every two waves, attack intervals shorten to a 0.5-second floor, and elite counts increase every three waves from wave 3 (up to six). Player weapon damage is unchanged.

| Wave | Raiders | Elites included | Regular shield/health |
| --- | --- | --- | --- |
| 1 | 6 | 0 | 48 |
| 3 | 8 | 1 | 62 |
| 6 | 11 | 2 | 83 |
| 12 | 17 | 4 | 125 |

Run `node tests/difficulty-check.mjs` for progression checks across 60 waves. The browser checks also verify actual wave 1/3/6/12 spawns and the live scenery.

The generated image under `design/` is the approved visual target; implemented WebGL scenery is a procedural interpretation rather than a pixel-identical reproduction of the concept image.
