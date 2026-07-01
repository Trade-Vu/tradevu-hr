import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect } from 'vitest';
import SettingsLeaveTypes from '../../pages/SettingsLeaveTypes.jsx';

// Mock AuthContext
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { organizationId: 'org1', id: 'user1' },
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('SettingsLeaveTypes Component', () => {
  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SettingsLeaveTypes />
      </QueryClientProvider>
    );
  };

  it('renders leave types from the MSW mock', async () => {
    renderComponent();

    // Verify loading state
    expect(screen.getByText('Loading leave types...')).toBeInTheDocument();

    // Wait for the mock data to render
    await waitFor(() => {
      expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    });

    // Check that the class override displays correctly
    expect(screen.getByText(/Manager:/)).toBeInTheDocument();
    expect(screen.getByText(/25 days/)).toBeInTheDocument();
  });

  it('allows adding a new class override', async () => {
    renderComponent();

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    });

    // Click "Add Leave Type" to open the form
    const addButton = screen.getByText('Add Leave Type');
    fireEvent.click(addButton);

    // Click "Add Class Override"
    const addOverrideButton = screen.getByText(/Add Class Override/i);
    fireEvent.click(addOverrideButton);

    // Verify inputs appear
    const classInputs = screen.getAllByPlaceholderText(/Class Name/i);
    expect(classInputs.length).toBeGreaterThan(0);

    const daysInputs = screen.getAllByPlaceholderText('Days');
    expect(daysInputs.length).toBeGreaterThan(0);

    // Type in the fractional day (e.g. 10.5)
    fireEvent.change(daysInputs[0], { target: { value: '10.5' } });
    expect(daysInputs[0].value).toBe('10.5');
  });
});
