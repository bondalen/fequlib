# feQuLib

Quasar UI Kit для FEMSQ и смежных проектов. Первый компонент — `FemsqTable`.

Документация проекта ведётся в **docs-registry** (Postgres), не в локальном JSON — см. Решение 008 FEMSQ.

## Установка (локальная зависимость)

```bash
# из femsq-frontend-q
npm install ../../../feQuLib
```

Или в `package.json`:

```json
"fequlib": "file:../../../feQuLib"
```

## Использование

```ts
import { FemsqTable, actionsColumn, type FemsqTableColumn } from 'fequlib';
```

## Реестр документации

Проект зарегистрирован как `fequlib` в `/home/alex/projects/docs-registry`.
