# feQuLib

Quasar UI Kit для FEMSQ и смежных проектов. Компоненты: `FemsqTable`, `FemsqTree` (v1), **`FemsqChart`** (ECharts 5), **`formatMoney`** (v0.1.2).

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
import {
  FemsqTable,
  FemsqTree,
  FemsqChart,
  buildTimeSeriesChartSpec,
  actionsColumn,
  moneyColumn,
  formatMoney,
  formatMoneyOrDash,
  type FemsqTableColumn,
  type ChartSpec
} from 'fequlib';
```

## Тесты и проверка типов

```bash
npm test          # Vitest: femsq-table, format-money, chart, tree
npm run typecheck # vue-tsc
```

CI: локально `npm test` + `npm run typecheck`. Пример workflow: [`docs/development/ci-workflow.example.yml`](./docs/development/ci-workflow.example.yml) (в `.github/workflows/` — при токене с scope `workflow`).

Покрыт контракт фильтрации/сортировки (`cellText`, `rowMatches*`, `compareCellValues`), `formatMoney` / `valueKind: 'money'`. Не покрыты: Vue SFC `FemsqTable.vue`, слоты header/body, интеграция с QTable.

## Связанные проекты

| Проект | Роль |
|---|---|
| [FEMSQ](https://github.com/bondalen/femsq) | Первый потребитель |
| [docs-registry](https://github.com/bondalen/docs-registry) | Реестр задач/журнала |
