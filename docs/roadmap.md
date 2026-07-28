# Roadmap feQuLib

## Сделано

- [x] Фаза A: `FemsqTable` (client filter/sort, `actionsColumn`, `mode`/`@request`)
- [x] Потребление из FEMSQ (`file:../../../feQuLib`)
- [x] GitHub: https://github.com/bondalen/fequlib
- [x] Projectize: `docs/` + `.cursorrules` + задачи в docs-registry

## Backlog (задачи в registry)

| Код | Тема | Приоритет |
|---|---|---|
| 0003 | Generic `rows`/`columns` (убрать `as unknown as Record…`) | medium |
| 0004 | Unit-тесты: cellText / filter / sort | medium |
| 0005 | Фаза B: поколоночные фильтры | medium |
| 0006 | Фаза C: аудит остальных гридов потребителей | low |
| 0007 | Фаза D: Group By (плоские строки) | low |
| 0008 | Фазы E–G: column chooser / Filter Editor / server-side точечно | low |
| 0009 | Упаковка Quasar App Extension (когда ≥2 потребителя) | low |

## Future (не сейчас)

- `FemsqTreeList` — отдельный компонент, отдельное обоснование.

## Принцип

Additive-first; не ломать FEMSQ без deprecate-цикла.
