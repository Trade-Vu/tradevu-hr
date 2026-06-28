/**
 * Unit tests for AcceptInvite.jsx
 * Tests: token validation states, form validation, redirect behaviour.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/api/graphqlClient', () => ({
  gqlClient: { request: vi.fn() },
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ checkAppState: vi.fn().mockResolvedValue(undefined) }),
}));

import AcceptInvite from '@/pages/AcceptInvite';
import { gqlClient } from '@/api/graphqlClient';

function renderWithToken(token) {
  const path = token ? `/accept-invite?token=${token}` : '/accept-invite';
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/accept-invite" element={<AcceptInvite />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AcceptInvite — Token Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error when no token is present in URL', async () => {
    renderWithToken(null);
    await waitFor(() => {
      expect(screen.getByText(/invalid or missing invite token/i)).toBeInTheDocument();
    });
  });

  it('shows error when token validation fails (expired)', async () => {
    gqlClient.request.mockResolvedValueOnce({
      validateInviteToken: { valid: false }
    });
    renderWithToken('expired-token-abc');
    await waitFor(() => {
      expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    });
  });

  it('shows error when validation request throws a network error', async () => {
    gqlClient.request.mockRejectedValueOnce(new Error('Network error'));
    renderWithToken('bad-token');
    await waitFor(() => {
      expect(screen.getByText(/failed to validate/i)).toBeInTheDocument();
    });
  });

  it('renders the form when token is valid', async () => {
    gqlClient.request.mockResolvedValueOnce({
      validateInviteToken: {
        valid: true,
        email: 'hr@tradevu.com',
        role: 'HR_ADMIN',
        organizationName: 'TradeVu',
      }
    });
    renderWithToken('valid-token-xyz');
    await waitFor(() => {
      expect(screen.getByText(/join tradevu/i)).toBeInTheDocument();
      expect(screen.getByText(/hr@tradevu.com/i)).toBeInTheDocument();
    });
  });
});

describe('AcceptInvite — Form Submission', () => {
  const validTokenDetails = {
    validateInviteToken: {
      valid: true,
      email: 'hr@tradevu.com',
      role: 'HR_ADMIN',
      organizationName: 'TradeVu',
    }
  };

  async function renderFormAndFill({ password = 'SecurePass1!', confirmPassword = 'SecurePass1!' } = {}) {
    // First mock: token validation (always succeeds)
    gqlClient.request.mockResolvedValueOnce(validTokenDetails);
    const user = userEvent.setup();
    renderWithToken('valid-token');
    await waitFor(() => expect(screen.getByText(/join/i)).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText('Jane'), 'Jane');
    await user.type(screen.getByPlaceholderText('Doe'), 'Doe');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], password);
    await user.type(passwordInputs[1], confirmPassword);
    return user;
  }

  it('shows error when passwords do not match', async () => {
    const user = await renderFormAndFill({ password: 'SecurePass1!', confirmPassword: 'Different1!' });
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows error when password is too short', async () => {
    const user = await renderFormAndFill({ password: 'short', confirmPassword: 'short' });
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('stores token in localStorage on successful submit', async () => {
    // Queue: [validateToken, acceptInvite]
    gqlClient.request
      .mockResolvedValueOnce(validTokenDetails)
      .mockResolvedValueOnce({
        acceptInvite: {
          token: 'new-token-abc',
          user: { id: 'u1', email: 'hr@tradevu.com', role: 'HR_ADMIN', organizationId: 'org1' }
        }
      });

    const user = userEvent.setup();
    renderWithToken('valid-token');
    await waitFor(() => expect(screen.getByText(/join/i)).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText('Jane'), 'Jane');
    await user.type(screen.getByPlaceholderText('Doe'), 'Doe');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'SecurePass1!');
    await user.type(passwordInputs[1], 'SecurePass1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('new-token-abc');
    });
  });

  it('shows success state after successful submission', async () => {
    gqlClient.request
      .mockResolvedValueOnce(validTokenDetails)
      .mockResolvedValueOnce({
        acceptInvite: {
          token: 'new-token-abc',
          user: { id: 'u1', email: 'hr@tradevu.com', role: 'HR_ADMIN', organizationId: 'org1' }
        }
      });

    const user = userEvent.setup();
    renderWithToken('valid-token');
    await waitFor(() => expect(screen.getByText(/join/i)).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText('Jane'), 'Jane');
    await user.type(screen.getByPlaceholderText('Doe'), 'Doe');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'SecurePass1!');
    await user.type(passwordInputs[1], 'SecurePass1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/welcome to tradevu hr/i)).toBeInTheDocument();
    });
  });
});
