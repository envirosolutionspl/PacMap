import type { RawLevelDefinition } from './levelTypes'

export const level01: RawLevelDefinition = {
  id: 'level-01',
  name: 'I plansza - Bałuty',
  difficulty: 'easy',
  ghostTypes: ['randomGhost', 'randomGhost'],
  map: [
    '###############',
    '#o.....#......#',
    '#.####.#.####.#',
    '#.#.........#.#',
    '#.#.###.###.#.#',
    '#.....#.#b....#',
    '#.###.....###.#',
    '#.....G.G.....#',
    '#.###.....###.#',
    '#....b#.#.....#',
    '#.#.###.###.#.#',
    '#.#.........#.#',
    '#.###.#.#.###.#',
    '#......P......#',
    '###############'
  ]
}
