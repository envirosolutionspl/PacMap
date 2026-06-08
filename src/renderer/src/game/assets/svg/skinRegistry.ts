import type {
  GhostMode,
  GhostSkinId,
  PlayerSkinId,
  PlayerStatus,
  SkinSettings
} from '../../engine/types'

export type SpriteKind = 'player' | 'ghost'

export type SpriteAnimationState = PlayerStatus | GhostMode

export type GhostStateAssetName = 'ghost-default' | 'ghost-frightened' | 'ghost-eaten'

export interface SvgSpriteAsset {
  readonly id: PlayerSkinId | GhostSkinId
  readonly kind: SpriteKind
  readonly label: string
  readonly viewBox: '0 0 32 32'
  readonly className: string
  readonly supportedStates: readonly SpriteAnimationState[]
  readonly layerNames: readonly string[]
}

export const PLAYER_SKINS: Record<PlayerSkinId, SvgSpriteAsset> = {
  'player-default': {
    id: 'player-default',
    kind: 'player',
    label: 'Default',
    viewBox: '0 0 32 32',
    className: 'player-skin-player-default',
    supportedStates: ['ready', 'moving', 'dead'],
    layerNames: [
      'player-ocean',
      'player-land',
      'player-eye',
      'player-globe-outline',
      'player-mouth-cut',
      'player-mouth-edge'
    ]
  }
}

export const GHOST_SKINS: Record<GhostSkinId, SvgSpriteAsset> = {
  'ghost-default': {
    id: 'ghost-default',
    kind: 'ghost',
    label: 'Default',
    viewBox: '0 0 32 32',
    className: 'ghost-skin-ghost-default',
    supportedStates: ['normal', 'frightened', 'eaten', 'respawning'],
    layerNames: [
      'money-bag-body',
      'money-bag-neck',
      'money-bag-band',
      'money-bag-string',
      'money-bag-eye',
      'money-bag-pupil'
    ]
  },
  'ghost-neon': {
    id: 'ghost-neon',
    kind: 'ghost',
    label: 'Neon',
    viewBox: '0 0 32 32',
    className: 'ghost-skin-ghost-neon',
    supportedStates: ['normal', 'frightened', 'eaten', 'respawning'],
    layerNames: [
      'money-bag-body',
      'money-bag-neck',
      'money-bag-band',
      'money-bag-string',
      'money-bag-eye',
      'money-bag-pupil'
    ]
  }
}

export const GHOST_SKIN_ORDER: readonly GhostSkinId[] = ['ghost-default', 'ghost-neon']

export const GHOST_STATE_ASSET_NAMES: Record<GhostMode, GhostStateAssetName> = {
  normal: 'ghost-default',
  frightened: 'ghost-frightened',
  eaten: 'ghost-eaten',
  respawning: 'ghost-eaten'
}

export const DEFAULT_SKINS: SkinSettings = {
  player: 'player-default',
  ghost: 'ghost-default'
}

export function getPlayerSkin(skinId: PlayerSkinId): SvgSpriteAsset {
  return PLAYER_SKINS[skinId] ?? PLAYER_SKINS['player-default']
}

export function getGhostSkin(skinId: GhostSkinId): SvgSpriteAsset {
  return GHOST_SKINS[skinId] ?? GHOST_SKINS['ghost-default']
}

export function getGhostSkinLabel(skinId: GhostSkinId): string {
  return getGhostSkin(skinId).label
}

export function getNextGhostSkinId(skinId: GhostSkinId): GhostSkinId {
  const currentIndex = GHOST_SKIN_ORDER.indexOf(skinId)
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % GHOST_SKIN_ORDER.length

  return GHOST_SKIN_ORDER[nextIndex] ?? 'ghost-default'
}
