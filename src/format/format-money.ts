/**
 * Опции форматирования денежных сумм (ru-RU по умолчанию).
 */
export interface FormatMoneyOptions {
  /** BCP-47 locale; default `ru-RU` (пробел — разделитель тысяч, запятая — дробная часть). */
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /** Суффикс, напр. ` ₽` для tooltip графика. */
  currencySuffix?: string;
}

/**
 * Преобразует значение ячейки/поля в число для форматирования.
 *
 * @param value сырое значение из API/БД
 * @returns конечное число или NaN
 */
function toMoneyNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return NaN;
    }
    return Number(trimmed.replace(/\s/g, '').replace(',', '.'));
  }
  return NaN;
}

/**
 * Форматирует денежную сумму для UI: `186961.48` → `186 961,48`.
 *
 * @param value число или строка; null/undefined/пусто → пустая строка
 * @param options locale и дробная часть
 * @returns отформатированная строка
 */
export function formatMoney(value: unknown, options?: FormatMoneyOptions): string {
  if (value == null || value === '') {
    return '';
  }
  const num = toMoneyNumber(value);
  if (!Number.isFinite(num)) {
    return String(value);
  }
  const locale = options?.locale ?? 'ru-RU';
  const minimumFractionDigits = options?.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options?.maximumFractionDigits ?? 2;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(num);
  return formatted + (options?.currencySuffix ?? '');
}

/**
 * formatMoney с fallback «—» для key-value панелей.
 *
 * @param value сумма или null
 * @param options опции форматирования
 */
export function formatMoneyOrDash(value: unknown, options?: FormatMoneyOptions): string {
  if (value == null || value === '') {
    return '—';
  }
  const formatted = formatMoney(value, options);
  return formatted === '' ? '—' : formatted;
}
