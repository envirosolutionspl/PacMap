import { describe, expect, it } from 'vitest'

import {
  AUDIO_GAME_VOLUME_STORAGE_KEY,
  AUDIO_MUTED_STORAGE_KEY,
  AUDIO_MENU_VOLUME_STORAGE_KEY,
  DEFAULT_MUSIC_VOLUME,
  createAudioManager,
  readAudioMutedPreference,
  readMusicVolumePreferences,
  writeMusicVolumePreference,
  writeAudioMutedPreference
} from './audioManager'

describe('audio manager', () => {
  it('keeps muted state without requiring Web Audio support', () => {
    const manager = createAudioManager({ muted: true })

    expect(manager.isMuted()).toBe(true)
    expect(manager.toggleMuted()).toBe(false)
    expect(manager.isMuted()).toBe(false)
    expect(() => manager.play('pellet')).not.toThrow()
  })

  it('stores the muted preference', () => {
    const storage = new MemoryStorage()

    expect(readAudioMutedPreference(storage)).toBe(false)

    writeAudioMutedPreference(true, storage)

    expect(storage.getItem(AUDIO_MUTED_STORAGE_KEY)).toBe('true')
    expect(readAudioMutedPreference(storage)).toBe(true)
  })

  it('stores menu and game music volume preferences with a 50% default', () => {
    const storage = new MemoryStorage()

    expect(readMusicVolumePreferences(storage)).toEqual({
      menu: DEFAULT_MUSIC_VOLUME,
      game: DEFAULT_MUSIC_VOLUME
    })

    writeMusicVolumePreference('menu', 0.75, storage)
    writeMusicVolumePreference('game', 0.3, storage)

    expect(storage.getItem(AUDIO_MENU_VOLUME_STORAGE_KEY)).toBe('0.75')
    expect(storage.getItem(AUDIO_GAME_VOLUME_STORAGE_KEY)).toBe('0.3')
    expect(readMusicVolumePreferences(storage)).toEqual({
      menu: 0.75,
      game: 0.3
    })
  })
})

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}
