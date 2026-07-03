import { decodeJWT } from './jwt';

describe('JWT Utilities', () => {
  describe('decodeJWT', () => {
    test('décode un JWT valide correctement', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      const result = decodeJWT(token);
      expect(result).toEqual(payload);
    });

    test('retourne null pour un token invalide', () => {
      const result = decodeJWT('invalid-token');
      expect(result).toBeNull();
    });

    test('retourne null pour un token avec un payload invalide', () => {
      const token = 'header.invalid-payload.signature';
      const result = decodeJWT(token);
      expect(result).toBeNull();
    });

    test('retourne null pour undefined', () => {
      const result = decodeJWT(undefined);
      expect(result).toBeNull();
    });

    test('retourne null pour null', () => {
      const result = decodeJWT(null);
      expect(result).toBeNull();
    });

    test('retourne null pour une chaîne vide', () => {
      const result = decodeJWT('');
      expect(result).toBeNull();
    });

    test('gère le token avec des caractères spéciaux', () => {
      const payload = { id: '123', email: 'test+test@example.com' };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      const result = decodeJWT(token);
      expect(result).toEqual(payload);
    });

    test('gère le token avec des tirets et underscores', () => {
      const payload = { id: '123' };
      const base64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_');
      const token = `header.${base64}.signature`;
      
      const result = decodeJWT(token);
      expect(result).toEqual(payload);
    });
  });
});
