import { formatDateTime, formatDateOnly, formatTimeRange } from './time';
import { describe, test, expect } from 'vitest';

describe('Test para Time Utils', () => {
  test('formatDateTime debería retornar string formateado o guión', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
    expect(formatDateTime('')).toBe('—');

    const result = formatDateTime('2026-06-24T15:00:00Z');
    expect(result).toContain('2026');
  });

  test('formatDateOnly debería retornar string formateado o guión', () => {
    expect(formatDateOnly(null)).toBe('—');
    expect(formatDateOnly(undefined)).toBe('—');

    const result = formatDateOnly('2026-06-24T15:00:00Z');
    expect(result).toContain('2026');
  });

  test('formatTimeRange debería retornar string con rango de horas o guión', () => {
    expect(formatTimeRange(null, '2026-06-24T15:00:00Z')).toBe('—');
    expect(formatTimeRange('2026-06-24T15:00:00Z', null)).toBe('—');

    const result = formatTimeRange('2026-06-24T15:00:00Z', '2026-06-24T17:00:00Z');
    expect(result).toContain('–');
  });
});