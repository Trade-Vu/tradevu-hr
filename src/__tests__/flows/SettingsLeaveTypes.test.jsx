/**
 * Settings → Leave Types: editing must update (not create), and the per-leave-type approval flow
 * must round-trip through the form.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  leaveApi: {
    getLeaveTypes: vi.fn(),
    createLeaveType: vi.fn(),
    updateLeaveType: vi.fn(),
    deleteLeaveType: vi.fn(),
  },
  approvalsApi: { getWorkflows: vi.fn() },
}));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'HR_ADMIN', organizationId: 'org1' } }),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import SettingsLeaveTypes from '@/pages/SettingsLeaveTypes';
import { leaveApi, approvalsApi } from '@/api';
import { toast } from 'sonner';

// Raw API shape: lean Mongo docs with `_id` only (the original cause of edit → duplicate).
const annual = {
  _id: 'lt-annual', name: 'Annual Leave', code: 'annual', defaultDays: 20, isPaid: true,
  requiresApproval: true, requiresAttachment: true, allowHalfDay: false, maxCarryOver: 5,
  approvalSteps: [{ order: 1, role: 'MANAGER' }, { order: 2, role: 'HR_ADMIN' }],
};
const sick = { _id: 'lt-sick', name: 'Sick Leave', code: 'sick', defaultDays: 10, isPaid: true, requiresApproval: true, approvalSteps: [] };

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><SettingsLeaveTypes /></QueryClientProvider>);
}

const editButtons = () => screen.getAllByRole('button').filter((b) => b.querySelector('svg.lucide-pen-square, svg.lucide-square-pen, svg.lucide-edit'));

describe('SettingsLeaveTypes', () => {
  beforeEach(() => {
    leaveApi.getLeaveTypes.mockResolvedValue([annual, sick]);
    leaveApi.updateLeaveType.mockResolvedValue({});
    leaveApi.createLeaveType.mockResolvedValue({});
    approvalsApi.getWorkflows.mockResolvedValue([
      { _id: 'wf1', type: 'leave', isActive: true, levels: [{ order: 1, role: 'HR_ADMIN' }] },
    ]);
  });

  it("shows each type's approval flow, falling back to the org default", async () => {
    renderPage();
    expect(await screen.findByText(/Employee's manager → HR Admin/)).toBeInTheDocument();
    expect(await screen.findByText(/Organization default \(HR Admin\)/)).toBeInTheDocument();
  });

  it('updates the existing leave type instead of creating a new one, preserving hidden fields and steps', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Annual Leave');
    await user.click(editButtons()[0]);

    expect(screen.getByText('Edit Leave Type')).toBeInTheDocument();
    expect(screen.getByLabelText(/custom steps for this leave type/i)).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(leaveApi.updateLeaveType).toHaveBeenCalled());
    expect(leaveApi.createLeaveType).not.toHaveBeenCalled();

    const [id, payload] = leaveApi.updateLeaveType.mock.calls[0];
    expect(id).toBe('lt-annual');
    expect(payload).toMatchObject({
      requiresAttachment: true,
      allowHalfDay: false,
      maxCarryOver: 5,
      approvalSteps: [{ order: 1, role: 'MANAGER' }, { order: 2, role: 'HR_ADMIN' }],
    });
    expect(payload).not.toHaveProperty('eligibleAfterDays');
    expect(payload).not.toHaveProperty('applicableTo');
  });

  it('clears custom steps when approval is switched off', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Annual Leave');
    await user.click(editButtons()[0]);
    await user.click(screen.getByRole('switch', { name: /requires approval/i }));

    expect(screen.getByText(/approved as soon as they're submitted/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(leaveApi.updateLeaveType).toHaveBeenCalled());
    expect(leaveApi.updateLeaveType.mock.calls[0][1]).toMatchObject({ requiresApproval: false, approvalSteps: [] });
  });

  it('switching to custom seeds a first step, and an empty custom flow is rejected', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Sick Leave');
    await user.click(editButtons()[1]);

    await user.click(screen.getByLabelText(/custom steps for this leave type/i));
    expect(screen.getByText('Step 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove step 1/i }));
    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/at least one approval step/i));
    expect(leaveApi.updateLeaveType).not.toHaveBeenCalled();
  });

  it('no longer shows the unsupported eligibility and class-override fields', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Annual Leave');
    await user.click(screen.getByRole('button', { name: /add leave type/i }));
    expect(screen.queryByText(/eligible after/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/overrides by employee class/i)).not.toBeInTheDocument();
  });
});

describe('approvalSteps helpers', async () => {
  const { normalizeApprovalSteps, formatApprovalChain } = await import('@/lib/approvalSteps');
  it('normalizes legacy FINANCE and renumbers', () => {
    expect(normalizeApprovalSteps([{ order: 3, role: 'finance' }, { order: 1, role: 'MANAGER' }]))
      .toEqual([{ order: 1, role: 'MANAGER' }, { order: 2, role: 'FINANCE_ADMIN' }]);
    expect(formatApprovalChain([{ order: 1, role: 'FINANCE' }])).toBe('Finance Admin');
  });
});
