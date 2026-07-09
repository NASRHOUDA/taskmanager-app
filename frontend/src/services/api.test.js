let capturedConfig;
let capturedRequestInterceptor;
let capturedResponseSuccessInterceptor;
let capturedResponseErrorInterceptor;

jest.mock("axios", () => {
  const mockInstance = {
    defaults: { headers: { common: {} } },
    interceptors: {
      request: {
        use: (fn) => {
          global.__capturedRequestInterceptor = fn;
        },
      },
      response: {
        use: (successFn, errorFn) => {
          global.__capturedResponseSuccessInterceptor = successFn;
          global.__capturedResponseErrorInterceptor = errorFn;
        },
      },
    },
  };
  return {
    create: (config) => {
      global.__capturedConfig = config;
      return mockInstance;
    },
  };
});

require("./api");

capturedConfig = global.__capturedConfig;
capturedRequestInterceptor = global.__capturedRequestInterceptor;
capturedResponseSuccessInterceptor = global.__capturedResponseSuccessInterceptor;
capturedResponseErrorInterceptor = global.__capturedResponseErrorInterceptor;

describe("API Service", () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.location;
    window.location = { href: "" };
  });

  it("uses baseURL /api with JSON content type", () => {
    expect(capturedConfig.baseURL).toBe("/api");
    expect(capturedConfig.headers["Content-Type"]).toBe("application/json");
  });

  it("adds Authorization header when a token exists in localStorage", () => {
    localStorage.setItem("token", "fake-token-123");
    const config = { headers: {} };
    const result = capturedRequestInterceptor(config);
    expect(result.headers.Authorization).toBe("Bearer fake-token-123");
  });

  it("does not add Authorization header when no token exists", () => {
    const config = { headers: {} };
    const result = capturedRequestInterceptor(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it("passes through successful responses unchanged", () => {
    const response = { data: { ok: true } };
    expect(capturedResponseSuccessInterceptor(response)).toBe(response);
  });

  it("redirects to /login and clears token on 401", async () => {
    localStorage.setItem("token", "expired-token");
    const error = { response: { status: 401 } };
    await expect(capturedResponseErrorInterceptor(error)).rejects.toBe(error);
    expect(localStorage.getItem("token")).toBeNull();
    expect(window.location.href).toBe("/login");
  });

  it("does not clear token for non-401 errors", async () => {
    localStorage.setItem("token", "still-valid-token");
    const error = { response: { status: 500 } };
    await expect(capturedResponseErrorInterceptor(error)).rejects.toBe(error);
    expect(localStorage.getItem("token")).toBe("still-valid-token");
    expect(window.location.href).toBe("");
  });
});
