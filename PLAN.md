# PLAN: Pac-Map

## Cel

Zbudować desktopową grę arcade inspirowaną klasyczną formułą labiryntu: gracz porusza się po planszy, zbiera punkty, unika przeciwników, korzysta z kulek mocy i przechodzi kolejne poziomy. Pierwsza wersja ma być grywalnym MVP z jednym poziomem testowym, a architektura ma pozwolić później łatwo dodawać poziomy, rodzaje przeciwników, ranking i animowane skórki SVG.

Projekt jest aplikacją Electron + Vite + React + TypeScript. Główna logika gry powinna działać w rendererze, ale być możliwie niezależna od Reacta i warstwy wizualnej.

## Najważniejsze decyzje architektoniczne

- Logika gry będzie oddzielona od renderowania.
- Plansza będzie oparta o siatkę kafelków, a ruch postaci będzie płynny między kafelkami.
- Dane poziomów będą opisane deklaratywnie w plikach TypeScript/JSON, bez kodowania poziomu bezpośrednio w komponentach.
- Docelowym rendererem będzie SVG: labirynt, gracz, duszki, kulki, efekty i skórki mają być osobnymi komponentami/assetami SVG.
- Animacje powinny używać CSS transitions/animations, transformów SVG i lekkich aktualizacji z `requestAnimationFrame`.
- Stan sesji gry będzie zarządzany w jednym miejscu, najlepiej przez `zustand`, ale czysta logika silnika nie powinna wymagać store'a.
- Ranking ma być przygotowany tak, aby w pierwszej wersji działał lokalnie, a później mógł zostać przeniesiony do backendu lub pliku zapisu.

## Docelowa struktura aplikacji

```text
src/
  main/
    index.ts
  preload/
    index.ts
    index.d.ts
  renderer/
    index.html
    src/
      App.tsx
      main.tsx
      game/
        engine/
          constants.ts
          types.ts
          createInitialGameState.ts
          gameLoop.ts
          movement.ts
          collisions.ts
          scoring.ts
          lives.ts
          powerMode.ts
          ghostAi.ts
          levelProgression.ts
        levels/
          levelTypes.ts
          levelParser.ts
          level-01.ts
          level-02.ts
          level-03.ts
          index.ts
        store/
          gameStore.ts
          rankingStore.ts
        render/
          GameScreen.tsx
          GameBoard.tsx
          SvgStage.tsx
          Hud.tsx
          PauseOverlay.tsx
          GameOverOverlay.tsx
          LevelCompleteOverlay.tsx
        entities/
          Player.tsx
          Ghost.tsx
          Pellet.tsx
          PowerPellet.tsx
          BonusPellet.tsx
          Wall.tsx
        assets/
          svg/
            player/
            ghosts/
            pellets/
            maze/
          animations/
            motion.css
            skins.css
        input/
          keyboard.ts
          directionBuffer.ts
        audio/
          audioTypes.ts
          audioManager.ts
        ranking/
          rankingTypes.ts
          localRanking.ts
        tests/
          fixtures/
      assets/
        base.css
        main.css
```

## Model gry

### Typy pól planszy

- `wall` - ściana, blokuje ruch.
- `empty` - puste przejście.
- `pellet` - zwykła kulka punktowa.
- `bonusPellet` - bonusowa ikona mapy z większą liczbą punktów.
- `powerPellet` - logo QGIS, uruchamia tryb jedzenia przeciwników.
- `playerSpawn` - start gracza.
- `ghostSpawn` - start duszków i miejsce powrotu po zjedzeniu.

### Podstawowe wartości MVP

- Zwykła kulka: 10 punktów.
- Bonusowa ikona mapy: 30 punktów.
- Logo QGIS: 100 punktów.
- Zjedzony duszek: 200 punktów.
- Życia: maksymalnie 3 na całą grę.
- Czas trybu mocy: 8 sekund.
- Czas powrotu zjedzonego duszka do gry: 10 sekund.
- Ruch duszków w MVP: losowy wybór poprawnego kierunku na skrzyżowaniach, bez zawracania, jeśli istnieje inna droga.

## Główne stany gry

- `idle` - ekran startowy lub oczekiwanie przed startem.
- `ready` - krótki stan przygotowania po starcie poziomu lub utracie życia.
- `playing` - aktywna rozgrywka.
- `powerMode` - wariant aktywnej rozgrywki, w którym duszki są jadalne.
- `lifeLost` - animacja i reset pozycji po kolizji.
- `levelComplete` - wszystkie kulki zebrane.
- `gameOver` - brak żyć.
- `paused` - pauza.

## Plan realizacji

### Etap 0: Porządkowanie startowego projektu

- [x] Usunąć domyślny ekran electron-vite z `App.tsx`.
- [x] Przygotować bazowy layout aplikacji: pełnoekranowa scena gry, ciemne tło, HUD i miejsce na planszę.
- [x] Uporządkować globalne style w `assets/main.css` i `assets/base.css`.
- [x] Dodać podstawowe konwencje nazewnictwa katalogów pod grę.
- [x] Uruchomić `npm run typecheck` po zmianach.

### Etap 1: Fundament domeny gry

- [x] Dodać `src/renderer/src/game/engine/types.ts` z typami: `Direction`, `Position`, `Tile`, `Entity`, `PlayerState`, `GhostState`, `GameState`.
- [x] Dodać `constants.ts` z rozmiarem kafelka, prędkościami, punktacją, czasami trybów i limitami żyć.
- [x] Dodać `levelTypes.ts` i format definicji poziomu.
- [x] Dodać `levelParser.ts`, który zamienia tekstową mapę poziomu na strukturę kafelków, spawn gracza, spawny duszków i listę kulek.
- [x] Przygotować `level-01.ts` jako pierwszy testowy poziom.
- [x] Dodać testy parsera poziomu.

### Etap 2: Renderowanie planszy SVG

- [x] Dodać `GameScreen.tsx` jako główny ekran gry.
- [x] Dodać `SvgStage.tsx`, który ustawia `viewBox`, skalowanie i responsywne dopasowanie planszy.
- [x] Dodać `GameBoard.tsx`, który renderuje ściany, puste pola i warstwę punktów.
- [x] Dodać komponenty `Wall`, `Pellet`, `BonusPellet`, `PowerPellet`.
- [x] Zaprojektować pierwszy prosty styl SVG: czytelne ściany, kontrastowe kulki, brak zależności od rasterów.
- [x] Dodać stabilne wymiary sceny, żeby UI nie przeskakiwał podczas gry.
- [x] Zweryfikować ręcznie, czy plansza mieści się w oknie Electron.

### Etap 3: Gracz i sterowanie

- [x] Dodać `Player.tsx` jako komponent SVG gracza.
- [x] Dodać `keyboard.ts` do obsługi strzałek oraz `WASD`.
- [x] Dodać `directionBuffer.ts`, aby gracz mógł nacisnąć kolejny kierunek chwilę przed skrzyżowaniem.
- [x] Dodać `movement.ts` z regułami ruchu po siatce i blokowaniem ścian.
- [x] Dodać podstawowy `gameLoop.ts` oparty o `requestAnimationFrame`.
- [x] Podłączyć ruch gracza do stanu gry.
- [x] Dodać pauzę pod `Escape` lub `P`.
- [x] Dodać testy dla ruchu i blokowania ścian.

### Etap 4: Zbieranie punktów, wynik i życia

- [x] Dodać `scoring.ts` z naliczaniem punktów.
- [x] Dodać wykrywanie zebrania zwykłej kulki.
- [x] Dodać wykrywanie zebrania bonusowej ikony mapy.
- [x] Dodać wykrywanie zebrania logo QGIS.
- [x] Dodać `Hud.tsx` z wynikiem, liczbą żyć i numerem poziomu.
- [x] Dodać `lives.ts` z utratą życia, resetem pozycji i końcem gry.
- [x] Dodać `GameOverOverlay.tsx`.
- [x] Dodać testy dla punktacji i limitu 3 żyć.

### Etap 5: Duszki MVP

- [x] Dodać `Ghost.tsx` jako komponent SVG duszka.
- [x] Dodać `ghostAi.ts` z losowym ruchem po planszy.
- [x] Dodać kilka duszków startujących z `ghostSpawn`.
- [x] Dodać kolizję gracza z duszkiem w normalnym trybie.
- [x] Po kolizji odejmować życie i resetować pozycje gracza oraz duszków.
- [x] Dodać krótki stan `ready` po utracie życia, aby gracz nie ginął natychmiast drugi raz.
- [x] Dodać testy dla kolizji gracz-duszek.

### Etap 6: Logo QGIS i jedzenie przeciwników

- [x] Dodać `powerMode.ts` z czasem trwania trybu mocy.
- [x] Po zebraniu logo QGIS przełączać przeciwników w czerwony stan `frightened`.
- [x] W stanie `frightened` kolizja z duszkiem daje punkty i ustawia duszka jako `eaten`.
- [x] Duszek `eaten` wraca na spawn i pozostaje nieaktywny przez 10 sekund.
- [x] Po 10 sekundach duszek wraca do gry w stanie normalnym.
- [x] Dodać osobną animację/kolor duszka w trybie mocy.
- [x] Dodać testy dla czasu trybu mocy i respawnu duszków.

### Etap 7: Warstwa animacji SVG

- [x] Dodać katalog `game/assets/svg` z miejscem na docelowe assety.
- [x] Dodać katalog `game/assets/animations` na animacje CSS/SVG.
- [x] Zdefiniować konwencję SVG: stały `viewBox`, nazwy warstw, brak inline wymiarów zależnych od ekranu.
- [x] Przygotować animację gracza: otwieranie/zamykanie ust, obrót zgodny z kierunkiem.
- [x] Przygotować animację duszka: falujący dół, oczy skierowane w kierunku ruchu.
- [x] Przygotować animację logo QGIS: pulsowanie bez zmiany layoutu.
- [x] Dodać obsługę `prefers-reduced-motion`.
- [x] Upewnić się, że animacje działają transformami i opacity, bez kosztownych przeliczeń layoutu.

### Etap 8: Zakończenie poziomu i pierwszy pełny loop gry

- [x] Wykrywać zebranie wszystkich kulek na planszy.
- [x] Dodać `LevelCompleteOverlay.tsx`.
- [x] Dodać restart poziomu i restart całej gry.
- [x] Dodać ekran startowy z przyciskiem rozpoczęcia gry.
- [x] Dodać podstawowe komunikaty: pauza, gotowość, koniec gry.
- [x] Przetestować ręcznie pełną ścieżkę: start, zbieranie, utrata życia, power mode, zjedzenie duszka, koniec poziomu, game over.

### Etap 9: Trzy poziomy i poziomy trudności

- [x] Dodać `level-02.ts` i `level-03.ts`.
- [x] Dodać `levelProgression.ts`.
- [x] Zróżnicować poziomy: układ labiryntu, liczba duszków, prędkość duszków, liczba kulek mocy.
- [x] Dodać przechodzenie do kolejnego poziomu po ukończeniu aktualnego.
- [x] Po ukończeniu trzeciego poziomu pokazać ekran zwycięstwa.
- [x] Dodać testy dla progresji poziomów.

### Etap 10: Rodzaje duszków

- [x] Rozszerzyć `GhostState` o typ duszka.
- [x] Dodać typ `randomGhost` jako obecne zachowanie.
- [x] Dodać typ `chaserGhost`, który częściej wybiera kierunek zmniejszający dystans do gracza.
- [x] Dodać typ `ambusherGhost`, który celuje kilka kafelków przed graczem.
- [x] Dodać typ `wandererGhost`, który preferuje dłuższe losowe ścieżki.
- [x] Dodać osobne kolory/skórki SVG dla typów duszków.
- [x] Zbalansować poziomy tak, aby trudność rosła stopniowo.

### Etap 11: Ranking lokalny

- [x] Dodać `rankingTypes.ts`.
- [x] Dodać `localRanking.ts` z zapisem do `localStorage` na start.
- [x] Dodać formularz wpisania nazwy gracza po końcu gry.
- [x] Dodać listę najlepszych wyników.
- [x] Dodać sortowanie po wyniku, a przy remisie po dacie.
- [x] Ograniczyć ranking do np. 10 najlepszych wyników.
- [x] Przygotować interfejs tak, aby później można było podmienić lokalny zapis na zapis przez Electron IPC lub backend.

### Etap 12: Skórki i asset pipeline SVG

- [x] Ustalić finalne nazewnictwo skórek: `ghost-default`, `ghost-frightened`, `ghost-eaten`, `player-default`.
- [x] Dodać mechanizm wyboru skórki w stanie gry lub ustawieniach.
- [x] Przygotować komponent `AnimatedSvgSprite`, który przyjmuje asset, stan animacji i kierunek.
- [x] Dodać pierwszą alternatywną skórkę duszka.
- [x] Dodać animowane warianty dla stanów: normalny, frightened, eaten, respawning.
- [x] Dodać dokumentację dla przyszłych plików SVG: rozmiar, viewBox, warstwy, kolory, klasy CSS.

### Etap 13: Audio i odczucie gry

- [x] Dodać `audioManager.ts`.
- [x] Dodać efekty: zebranie kulki, bonusowej ikony mapy, kulki mocy, zjedzenie duszka, utrata życia, koniec poziomu.
- [x] Dodać wyciszanie audio w ustawieniach.
- [x] Dodać proste przejścia ekranów i mikroanimacje HUD.
- [x] Sprawdzić, czy audio nie blokuje startu gry w Electronie.

### Etap 14: Testy, jakość i stabilizacja

- [x] Dodać testy jednostkowe dla parsera poziomów, ruchu, kolizji, punktacji, żyć i trybu mocy.
- [x] Zweryfikować stan gry: osobny store nie istnieje, więc pokrycie stabilizacyjne obejmuje sesję, pętlę gry, wejście, audio i render.
- [x] Dodać ręczną checklistę QA w tym pliku lub osobnym `QA.md`.
- [x] Uruchamiać przed zakończeniem większych etapów: `npm run typecheck`, `npm run lint`, `npm run build`.
- [x] Sprawdzić działanie w oknie desktopowym i przy mniejszych rozmiarach.
- [x] Sprawdzić, czy gra pozostaje czytelna bez docelowych assetów.

## Kolejność MVP

Najkrótsza droga do grywalnej pierwszej wersji:

1. Etap 0: porządkowanie startu.
2. Etap 1: typy, parser i pierwszy poziom.
3. Etap 2: renderowanie planszy SVG.
4. Etap 3: ruch gracza.
5. Etap 4: punkty, HUD i życia.
6. Etap 5: losowe duszki.
7. Etap 6: kulki mocy i respawn duszków.
8. Etap 8: pełny loop start-game over-restart.

Etapy 7, 9, 10, 11, 12 i 13 można rozwijać po stabilnym MVP.

## Kryteria ukończenia MVP

- Gracz może rozpocząć grę i poruszać się po jednym poziomie.
- Plansza blokuje ruch przez ściany.
- Wszystkie kulki są widoczne i możliwe do zebrania.
- Wynik rośnie zgodnie z typem zebranej kulki.
- Gracz ma maksymalnie 3 życia.
- Duszki poruszają się losowo po dozwolonych polach.
- Kolizja z normalnym duszkiem zabiera życie.
- Kulka mocy pozwala zjeść duszka.
- Zjedzony duszek wraca na start i wraca do gry po 10 sekundach.
- Po zebraniu wszystkich kulek poziom kończy się poprawnie.
- Po utracie wszystkich żyć pojawia się ekran końca gry.
- Projekt przechodzi `npm run typecheck`.

## Uwagi projektowe na później

- Unikać kopiowania oryginalnych nazw, grafik i dźwięków z klasycznych gier. Mechanika może być inspirowana gatunkiem, ale finalne assety, nazwa i oprawa powinny być własne.
- Nie mieszać AI duszków z komponentami React. Komponenty mają tylko renderować stan.
- Nie wiązać poziomów z konkretnymi rozmiarami okna. `SvgStage` powinien skalować całą planszę przez `viewBox`.
- Nie animować pozycji przez `top/left`; używać `transform`.
- Trzymać assety SVG małe, warstwowe i łatwe do stylowania klasami CSS.
- Zostawić możliwość dodania edytora poziomów w przyszłości, jeśli projekt pójdzie w tę stronę.
