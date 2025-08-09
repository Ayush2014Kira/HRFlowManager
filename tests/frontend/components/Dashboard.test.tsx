import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../../../client/src/pages/dashboard';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

const mockDashboardStats = {
  totalEmployees: '25',
  presentToday: '22',
  absentToday: '3',
  onLeaveToday: '2',
  pendingApprovals: '5',
  activeTimeEntries: '18'
};

const mockRecentActivities = [
  {
    id: '1',
    type: 'leave_application',
    description: 'John Doe applied for annual leave',
    timestamp: '2024-01-01T10:00:00Z',
    employeeName: 'John Doe'
  },
  {
    id: '2',
    type: 'punch_in',
    description: 'Jane Smith punched in',
    timestamp: '2024-01-01T09:30:00Z',
    employeeName: 'Jane Smith'
  }
];

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard header', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockImplementation((options) => {
        if (options.queryKey[0] === '/api/dashboard/stats') {
          return { data: mockDashboardStats, isLoading: false, error: null };
        }
        if (options.queryKey[0] === '/api/dashboard/recent-activities') {
          return { data: mockRecentActivities, isLoading: false, error: null };
        }
        return { data: [], isLoading: false, error: null };
      }),
    }));

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('HR Management System Overview')).toBeInTheDocument();
  });

  it('displays statistics cards', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockImplementation((options) => {
        if (options.queryKey[0] === '/api/dashboard/stats') {
          return { data: mockDashboardStats, isLoading: false, error: null };
        }
        return { data: [], isLoading: false, error: null };
      }),
    }));

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText('Total Employees')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Present Today')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows loading state for statistics', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      }),
    }));

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays recent activities', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockImplementation((options) => {
        if (options.queryKey[0] === '/api/dashboard/recent-activities') {
          return { data: mockRecentActivities, isLoading: false, error: null };
        }
        return { data: mockDashboardStats, isLoading: false, error: null };
      }),
    }));

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText('Recent Activities')).toBeInTheDocument();
    expect(screen.getByText('John Doe applied for annual leave')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith punched in')).toBeInTheDocument();
  });

  it('handles empty recent activities', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockImplementation((options) => {
        if (options.queryKey[0] === '/api/dashboard/recent-activities') {
          return { data: [], isLoading: false, error: null };
        }
        return { data: mockDashboardStats, isLoading: false, error: null };
      }),
    }));

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText('Recent Activities')).toBeInTheDocument();
    expect(screen.getByText(/no recent activities/i)).toBeInTheDocument();
  });

  it('displays quick action buttons', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        error: null,
      }),
    }));

    renderWithQueryClient(<Dashboard />);
    
    expect(screen.getByText('Add Employee')).toBeInTheDocument();
    expect(screen.getByText('Process Payroll')).toBeInTheDocument();
    expect(screen.getByText('View Reports')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockImplementation((options) => {
        if (options.queryKey[0] === '/api/dashboard/recent-activities') {
          return { data: mockRecentActivities, isLoading: false, error: null };
        }
        return { data: mockDashboardStats, isLoading: false, error: null };
      }),
    }));

    renderWithQueryClient(<Dashboard />);
    
    // Check if timestamps are formatted (exact format may vary based on implementation)
    expect(screen.getByText(/10:00|9:30/)).toBeInTheDocument();
  });

  it('handles API errors gracefully', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('API Error'),
      }),
    }));

    renderWithQueryClient(<Dashboard />);
    
    // Should still render the dashboard structure even with errors
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});