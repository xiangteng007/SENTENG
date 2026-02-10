import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock firebase service
vi.mock('../services/firebase', () => ({
  subscribeToAuthState: vi.fn((callback) => {
    // Simulate no user initially
    callback(null);
    return () => {};
  }),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  initializeDefaultRoles: vi.fn().mockResolvedValue(undefined),
}));

// Mock API service
vi.mock('../services/api', () => {
  const mockApi = {
    setToken: vi.fn(),
    clearToken: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
    api: mockApi,
    authApi: {
      login: vi.fn(),
      health: vi.fn(),
    },
  };
});

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export AuthProvider and useAuth', async () => {
    const { AuthProvider, useAuth } = await import('../context/AuthContext.jsx');
    expect(AuthProvider).toBeDefined();
    expect(useAuth).toBeDefined();
  });

  it('should render children when provided', async () => {
    const { AuthProvider } = await import('../context/AuthContext.jsx');

    render(
      <BrowserRouter>
        <AuthProvider>
          <div data-testid="child">Hello</div>
        </AuthProvider>
      </BrowserRouter>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should start with loading state then resolve', async () => {
    const { AuthProvider, useAuth } = await import('../context/AuthContext.jsx');

    function TestComponent() {
      const { loading, isAuthenticated } = useAuth();
      return (
        <div>
          <span data-testid="loading">{String(loading)}</span>
          <span data-testid="authed">{String(isAuthenticated)}</span>
        </div>
      );
    }

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authed').textContent).toBe('false');
  });

  it('should throw error when useAuth used outside AuthProvider', async () => {
    const { useAuth } = await import('../context/AuthContext.jsx');

    function BadComponent() {
      useAuth();
      return <div />;
    }

    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BadComponent />)).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });

  it('should provide canAccessPage and hasAction functions', async () => {
    const { AuthProvider, useAuth } = await import('../context/AuthContext.jsx');

    let authValue;
    function TestComponent() {
      authValue = useAuth();
      return null;
    }

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(authValue.loading).toBe(false);
    });

    expect(typeof authValue.canAccessPage).toBe('function');
    expect(typeof authValue.hasAction).toBe('function');
    // No user = no access
    expect(authValue.canAccessPage('dashboard')).toBe(false);
    expect(authValue.hasAction('projects', 'create')).toBe(false);
  });
});
