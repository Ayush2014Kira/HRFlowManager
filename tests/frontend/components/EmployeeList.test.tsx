import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Employees from '../../../client/src/pages/employees';

// Mock the API request function
jest.mock('../../../client/src/lib/queryClient', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '../../../client/src/lib/queryClient';

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

const mockEmployees = [
  {
    id: '1',
    name: 'John Doe',
    employeeId: 'EMP001',
    email: 'john.doe@example.com',
    phone: '1234567890',
    departmentId: 'dept-1',
    department: { id: 'dept-1', name: 'Engineering' },
    position: 'Software Engineer',
    salary: 75000,
    hireDate: '2024-01-01',
    status: 'active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    employeeId: 'EMP002',
    email: 'jane.smith@example.com',
    phone: '1234567891',
    departmentId: 'dept-2',
    department: { id: 'dept-2', name: 'Human Resources' },
    position: 'HR Manager',
    salary: 80000,
    hireDate: '2024-01-02',
    status: 'active',
  },
];

describe('Employees Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders employees list', async () => {
    // Mock the useQuery hook to return mock data
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      }),
    }));

    renderWithQueryClient(<Employees />);
    
    expect(screen.getByText('Employees')).toBeInTheDocument();
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

    renderWithQueryClient(<Employees />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('filters employees by search query', async () => {
    const user = userEvent.setup();
    
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      }),
    }));

    renderWithQueryClient(<Employees />);
    
    const searchInput = screen.getByPlaceholderText(/search employees/i);
    await user.type(searchInput, 'John');
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('opens add employee dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      }),
    }));

    renderWithQueryClient(<Employees />);
    
    const addButton = screen.getByText(/add employee/i);
    await user.click(addButton);
    
    expect(screen.getByText(/create employee/i)).toBeInTheDocument();
  });

  it('displays employee details correctly', () => {
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useQuery: jest.fn().mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      }),
    }));

    renderWithQueryClient(<Employees />);
    
    // Check if all employee details are displayed
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('HR Manager')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Human Resources')).toBeInTheDocument();
  });
});