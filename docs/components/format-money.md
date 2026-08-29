# Форматирование денежных сумм

**Версия:** 0.1.2 (2026-08-29)  
**Модуль:** `src/format/format-money.ts`

## Назначение

Единый вывод сумм из БД/API для всех потребителей feQuLib: **ru-RU**, два знака после запятой, разделитель тысяч — **пробел** (Unicode narrow no-break space от `Intl.NumberFormat`).

Пример: `186961.48` → `186 961,48`.

## API

```ts
import { formatMoney, formatMoneyOrDash, type FormatMoneyOptions } from 'fequlib';

formatMoney(186961.48);                    // '186 961,48'
formatMoney(null);                         // ''
formatMoneyOrDash(800.91);                 // '800,91'
formatMoneyOrDash(null);                   // '—'
formatMoney(100, { currencySuffix: ' ₽' }); // '100,00 ₽' — для tooltip графика
```

| Функция | Когда использовать |
|---------|---------------------|
| `formatMoney` | ячейки таблицы, tooltip (пусто → `''`) |
| `formatMoneyOrDash` | key-value панели (пусто → `—`) |

`FormatMoneyOptions`: `locale`, `minimumFractionDigits`, `maximumFractionDigits`, `currencySuffix`.

## FemsqTable

Для колонок грида достаточно **`valueKind: 'money'`** или хелпера **`moneyColumn`** — см. [FemsqTable.md](./FemsqTable.md#денежные-колонки-valuekind-v012).

`FemsqTable` при `valueKind: 'money'` подставляет `format` для **QTable** (отрисовка ячеек); `cellText` использует тот же `formatMoney` для фильтра.

Пользовательский `col.format` **перекрывает** `valueKind`.

## FemsqChart

`formatChartMoney` — обёртка над `formatMoney` с суффиксом ` ₽` (ось Y при `format: 'money'`).

## Тесты

`src/format/format-money.test.ts` · `femsq-table.test.ts` (valueKind в `cellText`).
