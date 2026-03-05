import { render, screen } from '@testing-library/react';
import CaseStatusBadge from '../CaseStatusBadge';

describe('CaseStatusBadge', () => {
  it('renders the supplied status label', () => {
    render(<CaseStatusBadge status="in_progress" />);

    expect(screen.getByText('in progress')).toBeInTheDocument();
  });

  it('renders the stale flag when present', () => {
    render(<CaseStatusBadge status="pending" staleFlagged />);

    expect(screen.getByText('pending • stale')).toBeInTheDocument();
  });

  it('falls back to pending styles for unknown statuses', () => {
    render(<CaseStatusBadge status="unknown_status" />);

    expect(screen.getByText('unknown status')).toHaveClass('bg-amber-100');
  });
});
