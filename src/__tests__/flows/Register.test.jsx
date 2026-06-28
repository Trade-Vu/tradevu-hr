/**
 * Unit tests for the Register.jsx multi-step flow.
 * Tests step navigation, field validation, and form state without hitting the network.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock the GQL client so no real network calls happen
vi.mock('@/api/graphqlClient', () => ({
  gqlClient: {
    request: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    checkAppState: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: false,
    user: null,
  }),
}));

import Register from '@/pages/Register';
import { gqlClient } from '@/api/graphqlClient';

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

describe('Register — Step Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Step 1 (Create workspace) by default', () => {
    renderRegister();
    expect(screen.getByText('Create workspace')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Acme Corp')).toBeInTheDocument();
  });

  it('Continue button is disabled when Step 1 org name is empty', () => {
    renderRegister();
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).toBeDisabled();
  });

  it('advances to Step 2 after filling org name', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByPlaceholderText('Acme Corp'), 'TradeVu');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText('Admin email')).toBeInTheDocument();
  });

  it('shows Back button from Step 2 onwards', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByPlaceholderText('Acme Corp'), 'TradeVu');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('Back button returns to the previous step', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByPlaceholderText('Acme Corp'), 'TradeVu');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('Create workspace')).toBeInTheDocument();
  });

  it('advances through all 5 steps', async () => {
    const user = userEvent.setup();
    renderRegister();

    // Step 1
    await user.type(screen.getByPlaceholderText('Acme Corp'), 'TradeVu');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText('Admin email')).toBeInTheDocument();

    // Step 2
    await user.type(screen.getByPlaceholderText('name@company.com'), 'ceo@tradevu.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText('Secure account')).toBeInTheDocument();

    // Step 3
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText('Employee defaults')).toBeInTheDocument();

    // Step 4
    await user.type(screen.getAllByPlaceholderText('••••••••')[0], 'Default123!');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText('Invite HR Team')).toBeInTheDocument();
  });

  it('calls the register GraphQL mutation on final step submit', async () => {
    const user = userEvent.setup();
    gqlClient.request.mockResolvedValueOnce({
      register: {
        token: 'test-token-123',
        user: { id: '1', email: 'ceo@tradevu.com', role: 'SUPER_ADMIN', organizationId: 'org1' }
      }
    });

    renderRegister();

    // Navigate to final step
    await user.type(screen.getByPlaceholderText('Acme Corp'), 'TradeVu');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.type(screen.getByPlaceholderText('name@company.com'), 'ceo@tradevu.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.type(screen.getAllByPlaceholderText('••••••••')[0], 'Default123!');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 5 — submit
    await user.click(screen.getByRole('button', { name: /complete setup/i }));

    await waitFor(() => {
      expect(gqlClient.request).toHaveBeenCalledWith(
        expect.anything(), // the GQL document
        expect.objectContaining({
          input: expect.objectContaining({
            email: 'ceo@tradevu.com',
            orgName: 'TradeVu',
          })
        })
      );
    });
  });

  it('shows error message when registration fails', async () => {
    const user = userEvent.setup();
    gqlClient.request.mockRejectedValueOnce({
      response: { errors: [{ message: 'Email already registered' }] }
    });

    renderRegister();

    // Navigate to final step
    await user.type(screen.getByPlaceholderText('Acme Corp'), 'TradeVu');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.type(screen.getByPlaceholderText('name@company.com'), 'existing@tradevu.com');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.type(screen.getAllByPlaceholderText('••••••••')[0], 'Default123!');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /complete setup/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });
});
