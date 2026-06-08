# SVG Asset Pipeline

Use this folder for future vector assets used by the game renderer.

## Stable Skin Names

Current registry names:

- `player-default` - default globe player skin.
- `ghost-default` - default money bag opponent skin.
- `ghost-frightened` - reserved state name for frightened opponent artwork.
- `ghost-eaten` - reserved state name for eaten opponent artwork.
- `ghost-neon` - first alternate money bag skin.

Runtime skin IDs live in `skinRegistry.ts`. The renderer wraps artwork with
`AnimatedSvgSprite`, which adds these classes:

- `player-skin-player-default` or `ghost-skin-ghost-default`.
- `sprite-skin-{skin-id}`.
- `sprite-state-{state}`.
- `sprite-direction-{direction}`.

## Source SVG Rules

- Every standalone sprite should use a stable `viewBox`, preferably `0 0 32 32`.
- Do not set fixed `width` or `height` on source SVG files.
- Keep layer names stable and CSS-friendly: `sprite-root`, `sprite-body`, `sprite-eyes`, `sprite-detail`, `sprite-effect`.
- Prefer fills, strokes, opacity and transforms controlled by CSS classes.
- Avoid screen-dependent inline dimensions. Scale sprites from the renderer using tile size and SVG `viewBox`.
- Keep animated states separate from base artwork. Use wrapper classes such as `sprite-state-moving`, `sprite-state-frightened`, `sprite-state-eaten`, `sprite-state-respawning`.
- Use transforms and opacity for animation whenever possible.
- If an asset needs path morphing, keep both paths in the same coordinate system and document the pair here.

## Layer Classes

Player skins should expose:

- `player-ocean`
- `player-land`
- `player-eye`
- `player-globe-outline`
- `player-mouth-cut`
- `player-mouth-edge`

Opponent money bag skins should expose:

- `money-bag-body`
- `money-bag-neck`
- `money-bag-band`
- `money-bag-string`
- `money-bag-eye`
- `money-bag-pupil`

## Animation States

Player states:

- `ready`
- `moving`
- `dead`

Ghost states:

- `normal`
- `frightened`
- `eaten`
- `respawning`

Planned folders:

- `player/` - player sprite variants.
- `ghosts/` - ghost skins and state variants.
- `pellets/` - pellet and power pellet artwork.
- `maze/` - wall and maze tile artwork.
