import { describe, test, expect, vi, beforeEach } from 'vitest';
import { 
  parseTokenPayload, 
  isTokenExpired, 
  getRoleFromToken, 
  isAuthenticated 
} from './auth';

describe('Auth Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('parseTokenPayload', () => {
    test('debería retornar null si no hay token', () => {
      expect(parseTokenPayload(null)).toBeNull();
      expect(parseTokenPayload('')).toBeNull();
    });

    test('debería retornar null si el token no tiene 3 partes', () => {
      expect(parseTokenPayload('part1.part2')).toBeNull();
    });

    test('debería retornar null si tiene error al decodificar', () => {
      expect(parseTokenPayload('part1.invalid@@@base64.part3')).toBeNull();
    });

    test('debería retornar el payload decodificado correctamente', () => {
      // {"role":"ROLE_ADMINISTRADOR","exp":1751280000}
      const payloadBase64 = btoa(JSON.stringify({ role: 'ROLE_ADMINISTRADOR', exp: 1751280000 }));
      const token = `header.${payloadBase64}.signature`;
      const result = parseTokenPayload(token);
      expect(result).toEqual({ role: 'ROLE_ADMINISTRADOR', exp: 1751280000 });
    });
  });

  describe('isTokenExpired', () => {
    test('debería retornar false si el payload no tiene propiedad exp', () => {
      expect(isTokenExpired({})).toBe(false);
      expect(isTokenExpired(null)).toBe(false);
    });

    test('debería retornar false si exp está en el futuro', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      expect(isTokenExpired({ exp: futureTime })).toBe(false);
    });

    test('debería retornar true si exp está en el pasado', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour in past
      expect(isTokenExpired({ exp: pastTime })).toBe(true);
    });
  });

  describe('getRoleFromToken', () => {
    test('debería retornar el rol correspondiente', () => {
      const payloadBase64 = btoa(JSON.stringify({ role: 'ROLE_DOCENTE' }));
      const token = `header.${payloadBase64}.signature`;
      expect(getRoleFromToken(token)).toBe('ROLE_DOCENTE');
    });

    test('debería retornar null si no hay rol o token inválido', () => {
      expect(getRoleFromToken(null)).toBeNull();
      expect(getRoleFromToken('header.payload.signature')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    test('debería retornar false si no existe token en localStorage', () => {
      expect(isAuthenticated()).toBe(false);
    });

    test('debería retornar false y limpiar token si el payload es inválido', () => {
      localStorage.setItem('resernur_token', 'header.invalidpayload.signature');
      expect(isAuthenticated()).toBe(false);
      expect(localStorage.getItem('resernur_token')).toBeNull();
    });

    test('debería retornar false y limpiar token si el token ha expirado', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const payloadBase64 = btoa(JSON.stringify({ role: 'ROLE_ESTUDIANTE', exp: pastTime }));
      const token = `header.${payloadBase64}.signature`;
      
      localStorage.setItem('resernur_token', token);
      expect(isAuthenticated()).toBe(false);
      expect(localStorage.getItem('resernur_token')).toBeNull();
    });

    test('debería retornar true si el token es válido y está vigente', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payloadBase64 = btoa(JSON.stringify({ role: 'ROLE_ESTUDIANTE', exp: futureTime }));
      const token = `header.${payloadBase64}.signature`;
      
      localStorage.setItem('resernur_token', token);
      expect(isAuthenticated()).toBe(true);
      expect(localStorage.getItem('resernur_token')).toBe(token);
    });
  });
});