import { getSession, validateSession, isAuthenticated, getCurrentUserId, validateResourceAccess } from '../session';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Session Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSession', () => {
    test('should return session when authenticated', async () => {
      const mockSession = { user: { id: 'user-123', name: 'Test User' } };
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await getSession();
      
      expect(result).toEqual(mockSession);
      expect(getServerSession).toHaveBeenCalled();
    });

    test('should return null when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const result = await getSession();
      
      expect(result).toBeNull();
    });
  });

  describe('validateSession', () => {
    test('should return session when authenticated', async () => {
      const mockSession = { user: { id: 'user-123', name: 'Test User' } };
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await validateSession();
      
      expect(result).toEqual(mockSession);
      expect(redirect).not.toHaveBeenCalled();
    });

    test('should redirect to login when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      await validateSession();
      
      expect(redirect).toHaveBeenCalledWith('/login');
    });

    test('should redirect to login with callbackUrl when provided', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      await validateSession('/dashboard');
      
      expect(redirect).toHaveBeenCalledWith('/login?callbackUrl=%2Fdashboard');
    });
  });

  describe('isAuthenticated', () => {
    test('should return true when authenticated', async () => {
      const mockSession = { user: { id: 'user-123', name: 'Test User' } };
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await isAuthenticated();
      
      expect(result).toBe(true);
    });

    test('should return false when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const result = await isAuthenticated();
      
      expect(result).toBe(false);
    });
  });

  describe('getCurrentUserId', () => {
    test('should return user ID when authenticated', async () => {
      const mockSession = { user: { id: 'user-123', name: 'Test User' } };
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await getCurrentUserId();
      
      expect(result).toBe('user-123');
    });

    test('should return null when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const result = await getCurrentUserId();
      
      expect(result).toBeNull();
    });
  });

  describe('validateResourceAccess', () => {
    test('should return true when resource belongs to current user', async () => {
      const mockSession = { user: { id: 'user-123', name: 'Test User' } };
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await validateResourceAccess('user-123');
      
      expect(result).toBe(true);
    });

    test('should return false when resource does not belong to current user', async () => {
      const mockSession = { user: { id: 'user-123', name: 'Test User' } };
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await validateResourceAccess('user-456');
      
      expect(result).toBe(false);
    });

    test('should return true when user is admin and allowAdmin is true', async () => {
      const mockSession = { user: { id: 'admin-123', name: 'Admin User', role: 'ADMIN' } };
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await validateResourceAccess('user-456', true);
      
      expect(result).toBe(true);
    });

    test('should return false when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const result = await validateResourceAccess('user-123');
      
      expect(result).toBe(false);
    });
  });
});
