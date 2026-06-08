import type { RawLevelDefinition } from './levelTypes'

export const level02: RawLevelDefinition = {
  id: 'level-02',
  name: 'II plansza - Fabryczna',
  difficulty: 'easy',
  ghostTypes: ['randomGhost', 'randomGhost', 'wandererGhost'],
  map: [
    '###############',
    '#o...#........#',
    '#.##.#.###.##.#',
    '#..........b..#',
    '###.###.#.#.#.#',
    '#...#...#.#.#.#',
    '#.#.#.###.#.#.#',
    '#.#...GGG.....#',
    '#.#.###.###.#.#',
    '#.#.#......b#.#',
    '#.#.#.#.###.#.#',
    '#.b...#.#.....#',
    '#.###.#.#.#.#.#',
    '#......P..#...#',
    '###############'
  ]
}
