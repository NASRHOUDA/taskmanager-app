import { decodeJWT } from './jwt';

describe('decodeJWT', () => {
  it('decodes a valid JWT payload', () => {
    const payload = { id: '123', email: 'user@example.com' };
    const base64Payload = btoa(JSON.stringify(payload));
    const token = `header.${base64Payload}.signature`;

    const result = decodeJWT(token);

    expect(result).toEqual(payload);
  });

  it('handles base64url characters (- and _) in the payload', () => {
    const payload = { id: '456', email: 'test+special@example.com' };
    const base64Payload = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const token = `header.${base64Payload}.signature`;

    const result = decodeJWT(token);

    expect(result).toEqual(payload);
  });

  it('returns null for a malformed token', () => {
    const result = decodeJWT('not-a-valid-token');

    expect(result).toBeNull();
  });

  it('returns null for an empty string', () => {
    const result = decodeJWT('');

    expect(result).toBeNull();
  });

  it('returns null when the payload segment is not valid base64 JSON', () => {
    const token = 'header.!!!not-base64!!!.signature';

    const result = decodeJWT(token);

    expect(result).toBeNull();
  });
});
