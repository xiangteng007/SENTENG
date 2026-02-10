import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock import.meta.env before importing the module
vi.stubGlobal('import', { meta: { env: { VITE_API_URL: 'http://test-api.example.com/api/v1' } } });

// We need to test the ApiService class directly
describe('ApiService', () => {
  let api;

  beforeEach(async () => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
    // Dynamic import to get fresh instance
    vi.resetModules();
  });

  it('should set and clear token', async () => {
    // Import fresh module
    const { api: apiInstance } = await import('../services/api.js');
    api = apiInstance;

    expect(api.token).toBeNull();

    api.setToken('test-jwt-token');
    expect(api.token).toBe('test-jwt-token');

    api.clearToken();
    expect(api.token).toBeNull();
  });

  it('should include Authorization header when token is set', async () => {
    const { api: apiInstance } = await import('../services/api.js');
    api = apiInstance;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });

    api.setToken('bearer-token-123');
    await api.get('/test-endpoint');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer bearer-token-123',
        }),
      }),
    );
  });

  it('should NOT include Authorization header when no token', async () => {
    const { api: apiInstance } = await import('../services/api.js');
    api = apiInstance;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });

    await api.get('/test-endpoint');

    const callHeaders = global.fetch.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBeUndefined();
  });

  it('should throw on non-OK response', async () => {
    const { api: apiInstance } = await import('../services/api.js');
    api = apiInstance;

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not found' }),
    });

    await expect(api.get('/missing')).rejects.toThrow('Not found');
  });

  it('should send POST with JSON body', async () => {
    const { api: apiInstance } = await import('../services/api.js');
    api = apiInstance;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    const payload = { name: 'Test Project', budget: 1000000 };
    await api.post('/projects', payload);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    );
  });

  it('should include credentials for HttpOnly cookie auth', async () => {
    const { api: apiInstance } = await import('../services/api.js');
    api = apiInstance;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await api.get('/auth/permissions');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        credentials: 'include',
      }),
    );
  });
});
