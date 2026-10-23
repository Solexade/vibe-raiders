# Vibe Raiders — 3D Playground

A standalone, true 3D browser survival game built with Three.js. The bright cream, mint, lavender, and coral landing page keeps the original collection portraits. The arena uses perspective WebGL rendering, real mesh geometry, lighting, soft shadows, collision, and raycast shooting.

## What's in the arena

- The classic open-grid arena: a square pastel perimeter, four double-cell cover columns in the original map positions, and a clear centre. Concrete grain, subtle slab joints, surface bump mapping, matte materials, and directional shadows add realism without the newer playground props. The arena remains rendered with perspective so the 3D characters, cover, and shooting share consistent depth.
- Four original voxel interpretations of the collection characters: glowing eyes, walking limbs, different hats/antennas, a rotating propeller, and tougher elite variants every third wave. These are procedural fan-game models, not official 3D collection assets.
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
