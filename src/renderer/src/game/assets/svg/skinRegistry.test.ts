import { describe, expect, it } from 'vitest'

import {
  GHOST_SKIN_ORDER,
  GHOST_SKINS,
  GHOST_STATE_ASSET_NAMES,
  PLAYER_SKINS,
  getGhostSkin,
  getGhostSkinLabel,
  getNextGhostSkinId,
  getPlayerSkin
} from './skinRegistry'

describe('skin registry', () => {
  it('defines the stable starter skin names', () => {
    expect(PLAYER_SKINS['player-default'].kind).toBe('player')
    expect(GHOST_SKINS['ghost-default'].kind).toBe('ghost')
    expect(GHOST_SKINS['ghost-neon'].supportedStates).toEqual([
      'normal',
      'frightened',
      'eaten',
      'respawning'
    ])
    expect(GHOST_STATE_ASSET_NAMES).toEqual({
      normal: 'ghost-default',
      frightened: 'ghost-frightened',
      eaten: 'ghost-eaten',
      respawning: 'ghost-eaten'
    })
  })

  it('cycles ghost skins in a stable order', () => {
    expect(GHOST_SKIN_ORDER).toEqual(['ghost-default', 'ghost-neon'])
    expect(getNextGhostSkinId('ghost-default')).toBe('ghost-neon')
    expect(getNextGhostSkinId('ghost-neon')).toBe('ghost-default')
  })

  it('returns skin metadata for rendering and labels', () => {
    expect(getPlayerSkin('player-default').className).toBe('player-skin-player-default')
    expect(getPlayerSkin('player-default').layerNames).toContain('player-ocean')
    expect(getPlayerSkin('player-default').layerNames).toContain('player-mouth-edge')
    expect(getGhostSkin('ghost-neon').className).toBe('ghost-skin-ghost-neon')
    expect(getGhostSkin('ghost-neon').layerNames).toContain('money-bag-body')
    expect(getGhostSkin('ghost-neon').layerNames).toContain('money-bag-pupil')
    expect(getGhostSkinLabel('ghost-neon')).toBe('Neon')
  })
})
