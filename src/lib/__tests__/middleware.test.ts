import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../../middleware';
import { getToken } from 'next-auth/jwt';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      next: jest.fn().mockReturnValue({
        headers: new Map(),
      }),
      redirect: jest.fn().mockImplementation((url) => ({ url })),
    },
  };
});

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create mock request
  const createMockRequest = (path: string) => {
    const url = `https://example.com${path}`;
    return {
      url,
      nextUrl: new URL(url),
      headers: new Map(),
    } as unknown as NextRequest;
  };

  test('should redirect unauthenticated users from protected paths to login', async () => {
    // Mock unauthenticated user
    (getToken as jest.Mock).mockResolvedValue(null);
    
    const request = createMockRequest('/dashboard');
    await middleware(request);
    
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/login',
      })
    );
  });

  test('should allow authenticated users to access protected paths', async () => {
    // Mock authenticated user
    (getToken as jest.Mock).mockResolvedValue({
      sub: 'user-123',
      username: 'testuser',
    });
    
    const request = createMockRequest('/dashboard');
    await middleware(request);
    
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  test('should redirect authenticated users from login/register to dashboard', async () => {
    // Mock authenticated user
    (getToken as jest.Mock).mockResolvedValue({
      sub: 'user-123',
      username: 'testuser',
    });
    
    const request = createMockRequest('/login');
    await middleware(request);
    
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/dashboard',
      })
    );
  });

  test('should add user headers for authenticated requests', async () => {
    // Mock authenticated user
    (getToken as jest.Mock).mockResolvedValue({
      sub: 'user-123',
      username: 'testuser',
    });
    
    const request = createMockRequest('/dashboard');
    const response = await middleware(request);
    
    expect(response.headers.get('x-user-id')).toBe('user-123');
    expect(response.headers.get('x-username')).toBe('testuser');
  });

  test('should not add user headers for unauthenticated requests', async () => {
    // Mock unauthenticated user
    (getToken as jest.Mock).mockResolvedValue(null);
    
    const request = createMockRequest('/');
    const response = await middleware(request);
    
    expect(response.headers.has('x-user-id')).toBeFalsy();
    expect(response.headers.has('x-username')).toBeFalsy();
  });
});
