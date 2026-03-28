/**
 * Tests for src/services/api.ts
 *
 * Covers:
 *  - APIError class construction
 *  - getAPIBaseURL() with env var / invalid URL / fallback
 *  - analyzeOrder() happy path
 *  - analyzeOrder() server error with JSON body
 *  - analyzeOrder() server error with non-JSON body
 *  - analyzeOrder() re-throws APIError
 *  - analyzeOrder() network TypeError
 *  - analyzeOrder() unknown error
 */

// We need to test getAPIBaseURL which runs at module load time.
// So we must manipulate env BEFORE importing.

const VALID_BACKEND = 'https://example.com';

beforeEach(() => {
  jest.resetModules();
  // Clear fetch mock between tests
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('APIError', () => {
  it('creates an error with status, statusText and message', async () => {
    const { APIError } = await import('../api');
    const err = new APIError(404, 'Not Found', 'resource missing');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('APIError');
    expect(err.status).toBe(404);
    expect(err.statusText).toBe('Not Found');
    expect(err.message).toBe('resource missing');
  });

  it('is instanceof Error', async () => {
    const { APIError } = await import('../api');
    const err = new APIError(500, 'Internal', 'boom');
    expect(err instanceof Error).toBe(true);
  });
});

describe('getAPIBaseURL (via module-level constant)', () => {
  it('uses NEXT_PUBLIC_API_URL env var when set to a valid URL', async () => {
    process.env.NEXT_PUBLIC_API_URL = VALID_BACKEND;
    const mod = await import('../api');
    // Trigger a call so we can inspect the URL used
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        order_id: 'X',
        decision: 'Accept',
        earnings_per_hour: 100,
        estimated_time_minutes: 10,
        suggested_relocation: null,
      }),
    });
    global.fetch = mockFetch;
    await mod.analyzeOrder({
      order_id: 'X',
      distance_km: 1,
      earnings: 50,
      location: { lat: 0, lng: 0 },
      timestamp: '',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('example.com'),
      expect.anything()
    );
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('falls back to localhost:8080 when env var is an invalid URL', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'not-a-url';
    // Spy on console.error to suppress expected warning
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const mod = await import('../api');
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        order_id: 'X',
        decision: 'Accept',
        earnings_per_hour: 100,
        estimated_time_minutes: 10,
        suggested_relocation: null,
      }),
    });
    global.fetch = mockFetch;
    await mod.analyzeOrder({
      order_id: 'X',
      distance_km: 1,
      earnings: 50,
      location: { lat: 0, lng: 0 },
      timestamp: '',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('localhost:8080'),
      expect.anything()
    );
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('uses hardcoded default when env var is absent', async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const mod = await import('../api');
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        order_id: 'X',
        decision: 'Accept',
        earnings_per_hour: 100,
        estimated_time_minutes: 10,
        suggested_relocation: null,
      }),
    });
    global.fetch = mockFetch;
    await mod.analyzeOrder({
      order_id: 'X',
      distance_km: 1,
      earnings: 50,
      location: { lat: 0, lng: 0 },
      timestamp: '',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('saathi-backend'),
      expect.anything()
    );
  });
});

describe('analyzeOrder', () => {
  let analyzeOrder: typeof import('../api').analyzeOrder;
  let APIError: typeof import('../api').APIError;

  beforeEach(async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const mod = await import('../api');
    analyzeOrder = mod.analyzeOrder;
    APIError = mod.APIError;
  });

  const validReq = {
    order_id: 'ORD123',
    distance_km: 5,
    earnings: 100,
    location: { lat: 12.97, lng: 77.59 },
    timestamp: '2026-01-01T00:00:00Z',
  };

  it('returns parsed response on success', async () => {
    const expected = {
      order_id: 'ORD123',
      decision: 'Accept' as const,
      earnings_per_hour: 400,
      estimated_time_minutes: 15,
      suggested_relocation: null,
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => expected,
    });

    const result = await analyzeOrder(validReq);
    expect(result).toEqual(expected);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/analyze-order'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReq),
      })
    );
  });

  it('throws APIError with JSON error body on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: 'Missing order_id' }),
    });

    await expect(analyzeOrder(validReq)).rejects.toThrow(APIError);
    try {
      await analyzeOrder(validReq);
    } catch (e: unknown) {
      const err = e as InstanceType<typeof APIError>;
      expect(err.status).toBe(400);
      expect(err.statusText).toBe('Bad Request');
      expect(err.message).toBe('Missing order_id');
    }
  });

  it('throws APIError with HTTP status when error body is not JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => { throw new Error('not json'); },
    });

    await expect(analyzeOrder(validReq)).rejects.toThrow(APIError);
    try {
      await analyzeOrder(validReq);
    } catch (e: unknown) {
      const err = e as InstanceType<typeof APIError>;
      expect(err.status).toBe(502);
      expect(err.message).toContain('502');
      expect(err.message).toContain('Bad Gateway');
    }
  });

  it('throws APIError with JSON error body that has no error field', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: async () => ({ detail: 'something wrong' }),
    });

    await expect(analyzeOrder(validReq)).rejects.toThrow(APIError);
    try {
      await analyzeOrder(validReq);
    } catch (e: unknown) {
      const err = e as InstanceType<typeof APIError>;
      expect(err.status).toBe(422);
      // Falls back to default message since no 'error' key
      expect(err.message).toBe('Failed to analyze order');
    }
  });

  it('wraps TypeError (network error) in APIError with status 0', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new TypeError('Failed to fetch')
    );

    await expect(analyzeOrder(validReq)).rejects.toThrow(APIError);
    try {
      await analyzeOrder(validReq);
    } catch (e: unknown) {
      const err = e as InstanceType<typeof APIError>;
      expect(err.status).toBe(0);
      expect(err.statusText).toBe('Network Error');
      expect(err.message).toContain('Failed to fetch');
    }
  });

  it('wraps unknown error in APIError with status 500', async () => {
    (global.fetch as jest.Mock).mockRejectedValue('random string error');

    await expect(analyzeOrder(validReq)).rejects.toThrow(APIError);
    try {
      await analyzeOrder(validReq);
    } catch (e: unknown) {
      const err = e as InstanceType<typeof APIError>;
      expect(err.status).toBe(500);
      expect(err.message).toContain('Unknown');
    }
  });

  it('wraps unknown Error instance in APIError with status 500', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('weird error'));

    await expect(analyzeOrder(validReq)).rejects.toThrow(APIError);
    try {
      await analyzeOrder(validReq);
    } catch (e: unknown) {
      const err = e as InstanceType<typeof APIError>;
      expect(err.status).toBe(500);
      expect(err.message).toContain('weird error');
    }
  });

  it('re-throws APIError unchanged', async () => {
    const original = new APIError(503, 'Service Unavailable', 'down');
    (global.fetch as jest.Mock).mockRejectedValue(original);

    await expect(analyzeOrder(validReq)).rejects.toThrow(original);
  });
});
