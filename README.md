## Licencja

Projekt jest udostępniany na licencji GNU General Public License v3.0 (GPL-3.0).

# PacMap

PacMap to desktopowa gra arcade dla EnviroSolutions, zbudowana w Electronie, React i TypeScript. Aplikacja przenosi klasyczny schemat labiryntu na motyw marketingowy OpenSource: gracz zbiera punkty, projekty i logo QGIS, unika kosztów, przechodzi kolejne dzielnice oraz zapisuje wynik w lokalnym rankingu.

Projekt jest aplikacją desktopową, nie samodzielną stroną WWW. Electron odpowiada za okno, fullscreen i zapis rankingu do pliku, a renderer React obsługuje całą rozgrywkę.

## Najważniejsze funkcje

- Pełna pętla gry: intro, menu, formularz gracza, tutorial, rozgrywka, koniec poziomu, koniec gry i powrót do menu.
- 5 poziomów kampanii: Bałuty, Fabryczna, Retkinia, Widzew i Łagiewniki.
- Płynny ruch po siatce kafelków, bufor skrętu oraz blokowanie ścian.
- 4 typy przeciwników: losowy, ścigający, wyprzedzający i eksplorujący dłuższe ścieżki.
- Tryb mocy po zebraniu logo QGIS: przeciwnicy przechodzą w stan frightened i mogą zostać zjedzeni.
- Lokalny ranking top 10 z nazwą gracza, numerem telefonu, wynikiem, poziomem i datą.
- Opcjonalny eksport rankingu do pliku tekstowego przez Electron IPC.
- Audio z muzyką menu/gry, efektami zdarzeń oraz zapamiętaniem głośności i wyciszenia.
- Ustawienia wizualne: skórka przeciwników, skala planszy, skala intro, fullscreen.
- Tryby serwisowe w ustawieniach: GodMode, ręczne przełączanie poziomów, warianty miasta i limity czasu.
- Szeroki zestaw testów jednostkowych dla logiki gry, wejścia, renderu, audio, rankingu i poziomów.

## Stack

- Electron 39
- electron-vite 5
- Vite 7
- React 19
- TypeScript 5
- Vitest 4
- Testing Library React
- ESLint 9
- Prettier 3
- electron-builder

## Wymagania

- Node.js i npm.
- Windows, macOS albo Linux z obsługą Electron.
- Dla buildów instalacyjnych: narzędzia systemowe wymagane przez `electron-builder` dla danej platformy.

Repo zawiera `package-lock.json`, więc domyślnym menedżerem pakietów jest npm.

## Szybki start

```bash
npm install
npm run dev
```

`npm run dev` uruchamia aplikację przez `electron-vite dev`.

Po buildzie produkcyjnym można uruchomić podgląd:

```bash
npm run build
npm run start
```

## Skrypty npm

| Skrypt | Opis |
| --- | --- |
| `npm run dev` | Uruchamia aplikację w trybie deweloperskim. |
| `npm run start` | Uruchamia preview zbudowanej aplikacji. |
| `npm run build` | Uruchamia typecheck dla Node i web, potem buduje aplikację przez electron-vite. |
| `npm run build:win` | Buduje aplikację i paczkę Windows przez electron-builder. |
| `npm run build:mac` | Buduje paczkę macOS. Przed release warto uruchomić `npm run typecheck`. |
| `npm run build:linux` | Buduje paczki Linux: AppImage, snap i deb. Przed release warto uruchomić `npm run typecheck`. |
| `npm run build:unpack` | Buduje rozpakowany katalog aplikacji. |
| `npm run test` | Uruchamia testy Vitest. |
| `npm run typecheck` | Sprawdza typy dla main/preload oraz renderera. |
| `npm run lint` | Uruchamia ESLint z cache. |
| `npm run format` | Formatuje repo przez Prettier. |

## Jak grać

| Akcja | Klawisze |
| --- | --- |
| Ruch | Strzałki albo `W`, `A`, `S`, `D` |
| Pauza | `P` |
| Powrót do menu | `Escape` |
| Potwierdzenie / przejście intro | `Space` |
| Audio on/off | `M` |
| Fullscreen | Przycisk w rogu aplikacji |

Punktacja:

- zwykły punkt: 10 pkt,
- bonus projektu/mapy: 30 pkt,
- logo QGIS: 100 pkt i start trybu mocy,
- zjedzony przeciwnik w trybie mocy: 200 pkt,
- w trybie limitu czasu: 10 pkt za każdą pozostałą sekundę po ukończeniu poziomu.

Parametry bazowe:

- 3 życia na grę,
- tryb mocy trwa 8 sekund,
- zjedzony przeciwnik wraca po 10 sekundach,
- czas przygotowania po starcie poziomu lub utracie życia trwa 1,2 sekundy.

## Poziomy

Poziomy są deklaratywne i znajdują się w `src/renderer/src/game/levels/`.

| Plik | Nazwa | Trudność | Przeciwnicy |
| --- | --- | --- | --- |
| `level-01.ts` | I plansza - Bałuty | easy | 2 |
| `level-02.ts` | II plansza - Fabryczna | easy | 3 |
| `level-03.ts` | III plansza - Retkinia | normal | 4 |
| `level-04.ts` | IV plansza - Widzew | normal | 4 |
| `level-05.ts` | V plansza - Łagiewniki | hard | 5 |

Symbole map:

| Symbol | Znaczenie |
| --- | --- |
| `#` | ściana |
| `.` | zwykły punkt |
| `b` | bonus projektu/mapy |
| `o` | logo QGIS, czyli power pellet |
| `P` | start gracza, dokładnie jeden na poziom |
| `G` | start przeciwnika, minimum jeden na poziom |
| `_` albo spacja | puste przejście |

Parser waliduje prostokątną mapę, pojedynczy spawn gracza, obecność przeciwników, wspierane symbole oraz spójność pól przechodnich. Testy dodatkowo pilnują osiągalności zbieralnych obiektów i braku zbyt otwartych placów 3x3.

## Struktura projektu

```text
src/
  main/
    index.ts                 # proces Electron, okno, IPC rankingu i fullscreen
  preload/
    index.ts                 # bezpieczny most window.api dla renderera
    index.d.ts               # typy API preload
  renderer/
    index.html
    src/
      App.tsx                # montuje GameScreen
      main.tsx               # start React
      assets/                # style globalne i grafiki UI
      game/
        engine/              # czysta logika gry bez Reacta i DOM
        levels/              # definicje i parser poziomów
        input/               # klawiatura i bufor kierunku
        audio/               # Web Audio, muzyka, preferencje audio
        ranking/             # model rankingu, localStorage, plik wyników
        entities/            # komponenty SVG postaci, ścian i obiektów
        render/              # ekrany, HUD, menu, plansza i overlaye
        assets/              # animacje, skórki SVG, dźwięki
        window/              # adapter fullscreen
```

## Architektura

Logika gry jest oddzielona od renderowania:

- `engine/` operuje na `GameState`, pozycjach, kafelkach, kolizjach i punktacji.
- `levels/` zamienia tekstowe mapy w struktury planszy i zbieralnych obiektów.
- `render/` trzyma komponenty React oraz glue code sesji w `GameScreen`.
- `entities/` renderuje SVG na podstawie stanu, bez własnych reguł gry.
- `audio/`, `ranking/` i `window/` są adapterami do API przeglądarki albo Electron.

Główna pętla działa przez `requestAnimationFrame`. Delta czasu jest ograniczana do 50 ms, żeby gra nie wykonywała ogromnego kroku po chwilowym przycięciu okna.

## Dane i trwałość

Aplikacja zapisuje preferencje w `localStorage`:

- `pac-map-ranking-v1` - lokalny ranking top 10,
- `pac-map-ranking-file-path-v1` - ścieżka pliku wyników,
- `pac-map-audio-muted` - wyciszenie,
- `pac-map-menu-volume` - głośność menu,
- `pac-map-game-volume` - głośność gry,
- `pac-map-game-board-scale-v1` - skala planszy,
- `pac-map-intro-overlay-scale-v1` - skala intro.

Zapis do pliku wyników przechodzi przez IPC:

- renderer wywołuje `window.api.chooseRankingFile()` i `window.api.writeRankingFile()`,
- preload wystawia API z `ipcRenderer`,
- main process otwiera systemowy dialog zapisu i zapisuje plik tekstowy.

## Testy i jakość

Podstawowy zestaw przed releasem:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

Zakres testów obejmuje między innymi:

- parser poziomów i walidację kampanii,
- ruch po siatce i bufor kierunku,
- kolizje, życia, punktację i tryb mocy,
- AI przeciwników,
- progresję poziomów,
- ranking lokalny,
- audio i efekty przejść,
- rejestr skórek SVG,
- smoke testy renderu menu, HUD, planszy i overlayów.

Ręczna checklista znajduje się w `QA.md`.

## Dodawanie poziomu

1. Dodaj plik `src/renderer/src/game/levels/level-XX.ts`.
2. Zdefiniuj `RawLevelDefinition`: `id`, `name`, `difficulty`, `map` i opcjonalne `ghostTypes`.
3. Upewnij się, że mapa jest prostokątna, ma dokładnie jedno `P` i co najmniej jedno `G`.
4. Dodaj poziom do `rawLevels` w `src/renderer/src/game/levels/index.ts`.
5. Uruchom `npm run test`, szczególnie testy parsera i progresji.

Przeciwnicy mogą używać typów:

- `randomGhost` - losowy ruch po dozwolonych kierunkach,
- `chaserGhost` - wybiera kierunek zbliżający do gracza,
- `ambusherGhost` - celuje kilka kafelków przed graczem,
- `wandererGhost` - preferuje bardziej otwarte, dłuższe ścieżki.

## Build i paczkowanie

Konfiguracja paczkowania jest w `electron-builder.yml`.

- `appId`: `envirosolutions.pl`
- `productName`: `PacMap`
- Windows: NSIS installer, skrót na pulpicie.
- macOS: DMG, notarization wyłączony.
- Linux: AppImage, snap i deb.
- Zasoby builda: `build/`
- Ikona aplikacji: `resources/icon.png`

Artefakty builda trafiają do katalogu `dist/`. Katalogi `dist/`, `out/`, `node_modules/` i cache nie powinny być commitowane.

## Przydatne pliki

- `PLAN.md` - historia planu prac i decyzje projektowe.
- `QA.md` - manualna checklista przed releasem.
- `src/renderer/src/game/README.md` - konwencje katalogu gry.
- `src/renderer/src/game/assets/svg/README.md` - zasady przyszłych assetów SVG.

## Uwagi rozwojowe

- Trzymaj reguły gry poza komponentami React.
- Nie używaj API DOM, audio ani localStorage w `engine/`.
- Poziomy powinny być deklaratywne, bez logiki w komponentach.
- Animacje SVG powinny bazować głównie na `transform` i `opacity`.
- Przy zmianach gameplayu dopisz lub zaktualizuj test w tym samym obszarze.


