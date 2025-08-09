import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Attendance from '../../../client/src/pages/attendance';

// Mock the API request function
jest.mock('../../../client/src/lib/queryClient', () => ({
  apiRequest: jest.fn(),
}));

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

const mockAttendanceRecords = [
  {
    id: '1',
    employeeId: 'emp-1',
    date: '2024-01-01',
    punchInTime: '2024-01-01T09:00:00Z',
    punchOutTime: '2024-01-01T17:00:00Z',
    status: 'present',
    employee: {
      id: 'emp-1',
      name: 'John Doe',
      employeeId: 'EMP001',
    },
  },
  {
    id: '2',
    employeeId: 'emp-2',
    date: '2024-01-01',
    punchInTime: '2024-01-01T09:30:00Z',
    punchOutTime: null,
    status: 'present',
    employee: {
      id: 'emp-2',
      name: 'Jane Smith',
      employeeId: 'EMP002',
    },
  },
];

describe('Attendance Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders attendance page header', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: mockAttendanceRecords,
        isLoading: false,
        error: null,
      }),
    }));

    renderWithQueryClient(<Attendance />);
    
    expect(screen.getByText('Attendance & Time Tracking')).toBeInTheDocument();
  });

  it('displays attendance records in table', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: mockAttendanceRecords,
        isLoading: false,
        error: null,
      }),
    }));

    renderWithQueryClient(<Attendance />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('EMP001')).toBeInTheDocument();
    expect(screen.getByText('EMP002')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      }),
    }));

    renderWithQueryClient(<Attendance />);
    
    expect(screen.getByText(/loading attendance records/i)).toBeInTheDocument();
  });

  it('filters attendance records by search query', async () => {
    const user = userEvent.setup();
    
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: mockAttendanceRecords,
        isLoading: false,
        error: null,
      }),
    }));

    renderWithQueryClient(<Attendance />);
    
    const searchInput = screen.getByPlaceholderText(/search employees/i);
    await user.type(searchInput, 'John');
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('opens punch modal when punch button is clicked', async () => {
    const user = userEvent.setup();
    
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: mockAttendanceRecords,
        isLoading: false,
        error: null,
      }),
    }));

    renderWithQueryClient(<Attendance />);
    
    const punchButton = screen.getByText(/punch in\/out/i);
    await user.click(punchButton);
    
    // Check if modal opens (this might need adjustment based on actual modal implementation)
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays correct status badges', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: mockAttendanceRecords,
        isLoading: false,
        error: null,
      }),
    }));

    renderWithQueryClient(<Attendance />);
    
    const presentBadges = screen.getAllByText('Present');
    expect(presentBadges).toHaveLength(2);
  });

  it('formats time correctly', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: mockAttendanceRecords,
        isLoading: false,
        error: null,
      }),
    }));

    renderWithQueryClient(<Attendance />);
    
    // Check for formatted times (this might need adjustment based on locale)
    expect(screen.getByText('09:00 AM')).toBeInTheDocument();
    expect(screen.getByText('05:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Not punched')).toBeInTheDocument();
  });

  it('calculates working hours correctly', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: mockAttendanceRecords,
        isLoading: false,
        error: null,
      }),
    }));

    renderWithQueryClient(<Attendance />);
    
    // John Doe worked 8 hours (9:00 AM to 5:00 PM)
    expect(screen.getByText('8.00')).toBeInTheDocument();
    // Jane Smith hasn't punched out yet
    expect(screen.getByText('0.00')).toBeInTheDocument();
  });
});