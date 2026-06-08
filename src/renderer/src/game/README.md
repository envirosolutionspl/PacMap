# Game module conventions

Ten katalog trzyma kod gry oddzielony od powloki Electron i ogolnego UI aplikacji.

- `engine/` zawiera czysta logike TypeScript: ruch, kolizje, punktacje, zycia, AI i petle gry.
- `levels/` zawiera definicje poziomow oraz parser map kafelkowych.
- `store/` zawiera integracje stanu z Reactem, docelowo przez `zustand`.
- `render/` zawiera komponenty ekranow i warstw planszy.
- `entities/` zawiera komponenty SVG dla gracza, duszkow, kulek i scian.
- `assets/svg/` zawiera przyszle pliki i warianty SVG.
- `assets/animations/` zawiera animacje CSS/SVG oraz style skorek.
- `input/` zawiera klawiature i bufor kierunku ruchu.
- `audio/` zawiera typy i manager efektow dzwiekowych.
- `ranking/` zawiera model i zapis wynikow.
- `tests/` zawiera testy logiki gry i fixture'y poziomow.

Nazewnictwo:

- Pliki z logika: `camelCase.ts`.
- Komponenty React/SVG: `PascalCase.tsx`.
- Poziomy: `level-01.ts` ... `level-05.ts`.
- Klasy CSS dla SVG: `kebab-case`.
- Assety SVG powinny miec stabilny `viewBox` i byc animowane glownie przez `transform` oraz `opacity`.

Symbole map poziomow:

- `#` - sciana.
- `.` - zwykla kulka.
- `b` - bonusowa ikona mapy, warta 3x zwyklej kulki.
- `o` - logo QGIS uruchamiajace tryb mocy.
- `P` - start gracza, dokladnie jeden na poziom.
- `G` - start duszka, minimum jeden na poziom.
- `_` albo spacja - puste, przechodnie pole.
