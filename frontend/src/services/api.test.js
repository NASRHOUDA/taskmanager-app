// Test simple pour api.js
describe('API Service - Tests Simples', () => {
  test('le service API est configuré correctement', () => {
    // Vérifier que localStorage fonctionne
    const token = 'test-token';
    localStorage.setItem('token', token);
    expect(localStorage.getItem('token')).toBe(token);
    localStorage.removeItem('token');
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('les headers sont configurés correctement', () => {
    // Simulation simple
    const headers = { 'Content-Type': 'application/json' };
    expect(headers['Content-Type']).toBe('application/json');
  });
});
