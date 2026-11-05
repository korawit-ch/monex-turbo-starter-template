import type { LinkResponse } from '@repo/api-contract';
import type { Permission } from '@repo/authorization';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import { useLinksQuery } from '../../../../data-access/links.client';
import { AuthProvider } from '../../../../providers/auth-provider';
import { LinksDemo } from './links-demo';

vi.mock('../../../../data-access/links.client', () => ({
  useLinksQuery: vi.fn(),
}));

const useLinksQueryMock = vi.mocked(useLinksQuery);
const refetch = vi.fn();

type QueryState = {
  data?: LinkResponse[];
  isLoading?: boolean;
  isFetching?: boolean;
  error?: Error | null;
};

function queryReturns(state: QueryState) {
  useLinksQueryMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
    error: null,
    refetch,
    ...state,
  } as unknown as ReturnType<typeof useLinksQuery>);
}

function link(
  id: number,
  title: string,
  allowed: { update: boolean; delete: boolean },
): LinkResponse {
  return {
    id,
    title,
    url: `https://example.com/${id}`,
    description: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    capabilities: {
      update: { allowed: allowed.update },
      delete: { allowed: allowed.delete },
    },
  };
}

function renderDemo(permissions: Permission[] = ['link.read']) {
  return render(
    <AuthProvider auth={{ userId: 'user-1', permissions }}>
      <LinksDemo />
    </AuthProvider>,
  );
}

beforeEach(() => {
  useLinksQueryMock.mockReset();
  refetch.mockReset();
});

describe('LinksDemo', () => {
  it('disables the query and explains why without link.read', () => {
    queryReturns({});

    renderDemo(['link.create']);

    expect(useLinksQueryMock).toHaveBeenCalledWith(false);
    expect(
      screen.getByText('You do not have permission to view links.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('enables the query with link.read and shows the loading state', () => {
    queryReturns({ isLoading: true, isFetching: true });

    renderDemo();

    expect(useLinksQueryMock).toHaveBeenCalledWith(true);
    expect(screen.getByText('Loading links...')).toBeInTheDocument();
  });

  it('shows an error instead of an empty list when the query fails', () => {
    queryReturns({ error: new Error('API Error: 500') });

    renderDemo();

    expect(screen.getByText('Error loading links')).toBeInTheDocument();
    expect(screen.queryByText('No links found')).not.toBeInTheDocument();
  });

  it('shows the empty state for an empty list', () => {
    queryReturns({ data: [] });

    renderDemo();

    expect(screen.getByText('No links found')).toBeInTheDocument();
  });

  it('lists links with the backend-computed capabilities', () => {
    queryReturns({
      data: [
        link(1, 'Admin link', { update: true, delete: true }),
        link(2, 'Read-only link', { update: false, delete: false }),
      ],
    });

    renderDemo();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Admin link');
    expect(items[0]).toHaveTextContent('#1');
    expect(items[0]).toHaveTextContent('Update: allowed');
    expect(items[0]).toHaveTextContent('Delete: allowed');
    expect(items[1]).toHaveTextContent('Read-only link');
    expect(items[1]).toHaveTextContent('Update: denied');
    expect(items[1]).toHaveTextContent('Delete: denied');
  });

  it('refetches from a keyboard-reachable button', () => {
    queryReturns({ data: [] });

    renderDemo();
    const button = screen.getByRole('button', { name: 'Refetch' });
    button.focus();
    fireEvent.click(button);

    expect(button).toHaveFocus();
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('disables the button while a background refetch runs', () => {
    queryReturns({ data: [], isFetching: true });

    renderDemo();

    expect(
      screen.getByRole('button', { name: 'Refetching...' }),
    ).toBeDisabled();
    expect(screen.getByText('Refetching links...')).toBeInTheDocument();
  });
});
