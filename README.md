# feQuLib

Quasar UI Kit для FEMSQ и смежных проектов. Первый компонент — `FemsqTable`.

**Репозиторий:** https://github.com/bondalen/fequlib  
**npm-пакет:** `fequlib`

Документация: [`docs/`](./docs/README.md). Задачи — в [docs-registry](https://github.com/bondalen/docs-registry) (проект `fequlib`), не в локальном JSON.

## Установка (локальная зависимость)

Пока FEMSQ рядом на диске:

```json
"fequlib": "file:../../../feQuLib"
```

(папка клона может называться `feQuLib`, имя пакета — `fequlib`.)

## Использование

```ts
import { FemsqTable, actionsColumn, type FemsqTableColumn } from 'fequlib';
```

## Тесты и проверка типов

```bash
npm test          # Vitest: чистые функции femsq-table (filter/sort)
npm run typecheck # vue-tsc
```

CI: локально `npm test` + `npm run typecheck`. Пример workflow: [`docs/development/ci-workflow.example.yml`](./docs/development/ci-workflow.example.yml) (в `.github/workflows/` — при токене с scope `workflow`).

Покрыт контракт фильтрации/сортировки (`cellText`, `rowMatches*`, `compareCellValues`). Не покрыты: Vue SFC `FemsqTable.vue`, слоты header/body, интеграция с QTable.

## Связанные проекты

| Проект | Роль |
|---|---|
| [FEMSQ](https://github.com/bondalen/femsq) | Первый потребитель |
| [docs-registry](https://github.com/bondalen/docs-registry) | Реестр задач/журнала |
