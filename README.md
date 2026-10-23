# Vibe Raiders — Neon Survival

Original fan concept: a standalone first-person 3D raycast survival game. Original geometric character art uses lime, pink, and dark tones; these are placeholders, not official Raiders artwork or verified brand colours. No wallet, backend, install, or build required. Music and SFX are synthesized locally after pressing Play. Sound can be muted. An optional Google Font falls back to Arial if unavailable.

## Play locally

Run `python3 -m http.server 8000` in this directory and open `http://localhost:8000` in a browser. WASD moves, mouse or arrow keys turn, click/Space fires, Shift sprints, Escape pauses. Touch controls appear on touch devices. Defeat each wave; kills restore three shield points. Best scores are stored in the browser when storage is available.

## Deploy to Netlify

Drag this folder into Netlify Drop, or connect the repository with publish directory `.` and no build command. `netlify.toml` includes the publish configuration. The entry point is `index.html`. No environment variables are needed. The original calendar remains at `orange-dynasty-calendar.html`.

## Replace placeholder artwork

The character renderer is `raider()` in `game.js`; the palette is in `style.css` and the rendering code. Official artwork was unavailable during development. Replace this renderer with licensed sprite images once supplied. This game has no connection to the Raiders service or blockchain.
