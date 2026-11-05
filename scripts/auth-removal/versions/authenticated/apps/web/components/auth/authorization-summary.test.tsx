import type { Permission } from '@repo/authorization';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { AuthProvider } from '../../providers/auth-provider';
import { AuthorizationSummary } from './authorization-summary';

function renderSummary(permissions: Permission[]) {
  return render(
    <AuthProvider auth={{ userId: 'user-42', permissions }}>
      <AuthorizationSummary />
    </AuthProvider>,
  );
}

/** The description that follows a term in the summary's description list. */
function valueOf(term: string) {
  const description = screen.getByText(term, {
    selector: 'dt',
  }).nextElementSibling;
  expect(description).toHaveRole('definition');
  return description;
}

describe('AuthorizationSummary', () => {
  it('shows the user id and the granted actions', () => {
    renderSummary(['link.read', 'link.create']);

    expect(valueOf('User')).toHaveTextContent('user-42');
    expect(valueOf('Action grants')).toHaveTextContent(
      'link.read, link.create',
    );
  });

  it('says None when no action is granted', () => {
    renderSummary([]);

    expect(valueOf('Action grants')).toHaveTextContent('None');
  });

  it('does not render resource scope details', () => {
    renderSummary(['link.read']);

    expect(valueOf('Resource scope')).toHaveTextContent(
      'Kept server-side; capabilities below are computed by the API.',
    );
  });
});
