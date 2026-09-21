/**
 * Unit tests for AcceptInvite.jsx
 * Tests: token validation states, form validation, redirect behaviour.
 *
 * AcceptInvite.jsx calls REST `authApi.getInviteDetails`/`authApi.acceptInvite`
 * (see src/api/auth.api.js), not GraphQL — this file used to mock `gqlClient`,
 * which the component never calls, so every test here silently exercised the
 * real (unmocked) axios client against jsdom and failed with "Network Error".
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/api/auth.api', () => ({
  authApi: {
    getInviteDetails: vi.fn(),
    acceptInvite: vi.fn(),
  },
}));

// Client-side validation (password length/match) reports via a toast, not
// inline text — no <Toaster/> is mounted in this bare render, so assert the
// call instead of DOM text.
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import AcceptInvite from '@/pages/AcceptInvite';
import { authApi } from '@/api/auth.api';
import { toast } from 'sonner';

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

const validInviteDetails = {
  email: 'hr@tradevu.com',
  role: 'HR_ADMIN',
  fullName: '',
  organizationName: 'Tradevu',
};

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

  it('shows error when the invite token is invalid or expired', async () => {
    const err = new Error('This invite link is invalid or has expired.');
    err.status = 400;
    authApi.getInviteDetails.mockRejectedValueOnce(err);
    renderWithToken('expired-token-abc');
    await waitFor(() => {
      expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    });
  });

  it('shows a clean, actionable message for a 404 — not the raw backend "Cannot GET ..." text', async () => {
    // client.js's response interceptor rewrites Nest's internal unmatched-route
    // message before it ever reaches a page, so the error this component sees
    // for a 404 is already the clean generic message, not the raw path.
    const err = new Error('The requested resource could not be found. Please try again in a moment.');
    err.status = 404;
    authApi.getInviteDetails.mockRejectedValueOnce(err);
    renderWithToken('5e18be1dba3ef44711113c9a1968fbf06bd7b54da887037e02d6ea011b5d8384');
    await waitFor(() => {
      expect(screen.getByText(/service is temporarily unavailable|could not be found/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/cannot get/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/api\/v1\//)).not.toBeInTheDocument();
  });

  it('ellipsizes an unexpectedly long error message instead of rendering it in full', async () => {
    const longToken = '5e18be1dba3ef44711113c9a1968fbf06bd7b54da887037e02d6ea011b5d8384'.repeat(3);
    const err = new Error(`Cannot GET /api/v1/auth/invite/${longToken}`);
    err.status = 404;
    authApi.getInviteDetails.mockRejectedValueOnce(err);
    renderWithToken(longToken);
    await waitFor(() => {
      expect(screen.getByText(/…/)).toBeInTheDocument();
    });
    const shown = screen.getByText(/…/).textContent;
    expect(shown.length).toBeLessThan(err.message.length);
  });

  it('renders the form when token is valid', async () => {
    authApi.getInviteDetails.mockResolvedValueOnce(validInviteDetails);
    renderWithToken('valid-token-xyz');
    await waitFor(() => {
      expect(screen.getByText(/join tradevu/i)).toBeInTheDocument();
      expect(screen.getByText(/hr@tradevu.com/i)).toBeInTheDocument();
    });
  });
});

describe('AcceptInvite — Form Submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function renderFormAndFill({ password = 'SecurePass1!', confirmPassword = 'SecurePass1!' } = {}) {
    authApi.getInviteDetails.mockResolvedValueOnce(validInviteDetails);
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
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/passwords do not match/i));
    });
  });

  it('shows error when password is too short', async () => {
    const user = await renderFormAndFill({ password: 'short', confirmPassword: 'short' });
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/at least 8 characters/i));
    });
  });

  it('stores token in localStorage on successful submit', async () => {
    authApi.getInviteDetails.mockResolvedValueOnce(validInviteDetails);
    authApi.acceptInvite.mockResolvedValueOnce({
      token: 'new-token-abc',
      user: { id: 'u1', email: 'hr@tradevu.com', role: 'HR_ADMIN', organizationId: 'org1' },
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
    authApi.getInviteDetails.mockResolvedValueOnce(validInviteDetails);
    authApi.acceptInvite.mockResolvedValueOnce({
      token: 'new-token-abc',
      user: { id: 'u1', email: 'hr@tradevu.com', role: 'HR_ADMIN', organizationId: 'org1' },
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
