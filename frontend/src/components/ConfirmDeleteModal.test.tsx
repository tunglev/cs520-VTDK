import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    title: 'Delete Listing',
    message: 'Are you sure you want to delete this?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders title and message', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText('Delete Listing')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this?')).toBeInTheDocument();
  });

  it('calls onConfirm when Delete is clicked', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} />);

    await userEvent.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onCancel={onCancel} />);

    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows "Deleting..." when loading', () => {
    render(<ConfirmDeleteModal {...defaultProps} loading={true} />);
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(<ConfirmDeleteModal {...defaultProps} loading={true} />);
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Deleting...')).toBeDisabled();
  });
});
