import { render, screen } from '@testing-library/react';
import { StatusIndicator } from '../status-indicator';

describe('StatusIndicator', () => {
  it('renders label correctly', () => {
    render(<StatusIndicator status="online" label="API" />);
    expect(screen.getByText('API')).toBeInTheDocument();
  });

  it('shows green indicator for online status', () => {
    const { container } = render(
      <StatusIndicator status="online" label="DB" />,
    );
    const dot = container.querySelector('.bg-green-500');
    expect(dot).toBeInTheDocument();
  });

  it('shows red indicator for offline status', () => {
    const { container } = render(
      <StatusIndicator status="offline" label="Service" />,
    );
    const dot = container.querySelector('.bg-red-500');
    expect(dot).toBeInTheDocument();
  });

  it('shows yellow indicator for syncing status', () => {
    const { container } = render(
      <StatusIndicator status="syncing" label="Cache" />,
    );
    const dot = container.querySelector('.bg-yellow-500');
    expect(dot).toBeInTheDocument();
  });
});
