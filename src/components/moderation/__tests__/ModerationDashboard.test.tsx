import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ModerationDashboard from '@/app/moderation/page';

// Mock the dependencies
jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('@/components/moderation/ModerationQueue', () => ({
    ModerationQueue: () => <div data-testid="moderation-queue">Moderation Queue</div>
}));
jest.mock('@/components/moderation/ModerationStats', () => ({
    ModerationStats: () => <div data-testid="moderation-stats">Moderation Stats</div>
}));
jest.mock('@/components/moderation/UserManagement', () => ({
    UserManagement: () => <div data-testid="user-management">User Management</div>
}));
jest.mock('@/components/moderation/ModerationSettings', () => ({
    ModerationSettings: () => <div data-testid="moderation-settings">Moderation Settings</div>
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('ModerationDashboard', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        mockUseRouter.mockReturnValue({
            push: mockPush,
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
        } as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('shows loading state when session is loading', () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'loading',
            update: jest.fn(),
        });

        render(<ModerationDashboard />);

        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('redirects to login when user is not authenticated', () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<ModerationDashboard />);

        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('renders moderation dashboard when user is authenticated', () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                    name: 'Test User',
                },
                expires: '2024-01-01',
            },
            status: 'authenticated',
            update: jest.fn(),
        });

        render(<ModerationDashboard />);

        expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Manage content moderation, user reports, and community safety')).toBeInTheDocument();

        // Check that all tabs are present
        expect(screen.getByText('Moderation Queue')).toBeInTheDocument();
        expect(screen.getByText('Statistics')).toBeInTheDocument();
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();

        // Check that the default tab (queue) is active
        expect(screen.getByTestId('moderation-queue')).toBeInTheDocument();
    });

    it('switches tabs correctly', () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                    name: 'Test User',
                },
                expires: '2024-01-01',
            },
            status: 'authenticated',
            update: jest.fn(),
        });

        render(<ModerationDashboard />);

        // Initially shows queue tab
        expect(screen.getByTestId('moderation-queue')).toBeInTheDocument();

        // Click on Statistics tab
        const statsTab = screen.getByRole('button', { name: /📊 Statistics/ });
        statsTab.click();

        expect(screen.getByTestId('moderation-stats')).toBeInTheDocument();
    });
});