/* eslint-disable no-undef */
import { formatTimeRange } from './time'

describe('Test para Time Utils', () => {
    test('Formate date range devuelve string correcto', () => {
        const start = "2026-01-01";
        const end = "2026-02-02";

        const result = formatTimeRange(start, end);

        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(3)
        expect(typeof(result)).toBe('string')
        console.log(result);
    })
})