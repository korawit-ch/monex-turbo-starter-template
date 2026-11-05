import { describe, it, expect, vi } from 'vitest';
import { createRef, forwardRef, type AnchorHTMLAttributes } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { Button } from './button';

describe('Button as a button', () => {
  it('renders type="button" by default so it never submits a form by accident', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Save</Button>
      </form>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');

    fireEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each(['submit', 'reset'] as const)('forwards type="%s"', (type) => {
    render(<Button type={type}>Go</Button>);

    expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute(
      'type',
      type,
    );
  });

  it('calls onClick when enabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Go' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and ignores clicks when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards the ref to the button element', () => {
    const ref = createRef<HTMLButtonElement | HTMLAnchorElement>();
    render(<Button ref={ref}>Go</Button>);

    expect(ref.current).toBe(screen.getByRole('button', { name: 'Go' }));
  });
});

describe('Button as a link', () => {
  it('renders an anchor without a type attribute when href is set', () => {
    render(
      <Button href="/next" type="submit">
        Next
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Next' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/next');
    expect(link).not.toHaveAttribute('type');
    expect(link).not.toHaveAttribute('aria-disabled');
    expect(link).not.toHaveAttribute('tabindex');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onClick and keeps navigation when enabled', () => {
    const onClick = vi.fn();
    render(
      <Button href="#next" onClick={onClick}>
        Next
      </Button>,
    );

    const notPrevented = fireEvent.click(
      screen.getByRole('link', { name: 'Next' }),
    );

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(notPrevented).toBe(true);
  });

  it('marks a disabled link aria-disabled, removes it from the tab order and blocks navigation', () => {
    const onClick = vi.fn();
    render(
      <Button href="/next" disabled onClick={onClick}>
        Next
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Next' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');

    const notPrevented = fireEvent.click(link);

    expect(notPrevented).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders the `as` component with the link props and ref', () => {
    const received: AnchorHTMLAttributes<HTMLAnchorElement>[] = [];
    const RouterLink = forwardRef<
      HTMLAnchorElement,
      AnchorHTMLAttributes<HTMLAnchorElement>
    >((props, ref) => {
      received.push(props);
      return <a ref={ref} data-router-link="" {...props} />;
    });
    RouterLink.displayName = 'RouterLink';
    const ref = createRef<HTMLButtonElement | HTMLAnchorElement>();

    render(
      <Button href="/settings" as={RouterLink} ref={ref}>
        Settings
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link).toHaveAttribute('data-router-link');
    expect(link).toHaveAttribute('href', '/settings');
    expect(ref.current).toBe(link);
    expect(received.at(-1)).toMatchObject({ href: '/settings' });
  });

  it('renders a button, not the `as` component, without href', () => {
    const RouterLink = vi.fn(() => null);

    render(<Button as={RouterLink}>Plain</Button>);

    expect(screen.getByRole('button', { name: 'Plain' })).toBeInTheDocument();
    expect(RouterLink).not.toHaveBeenCalled();
  });
});

describe('Button icon slots', () => {
  it('hides icons from assistive technology and from the accessible name', () => {
    render(
      <Button
        startIcon={<i data-testid="start-icon">+</i>}
        endIcon={<i data-testid="end-icon">→</i>}
      >
        Continue
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Continue' });
    expect(screen.getByTestId('start-icon').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByTestId('end-icon').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(button).toHaveTextContent('+Continue→');
  });

  it('renders no icon wrappers when no icons are given', () => {
    render(<Button>Continue</Button>);

    expect(
      screen
        .getByRole('button', { name: 'Continue' })
        .querySelector('[aria-hidden]'),
    ).toBeNull();
  });
});

describe('Button variants', () => {
  it.each([
    ['primary', 'bg-primary-600'],
    ['secondary', 'bg-transparent'],
    ['linked', 'border-none'],
    ['textlink', 'underline'],
  ] as const)('applies the %s variant styles', (variant, expectedClass) => {
    render(<Button variant={variant}>Styled</Button>);

    expect(screen.getByRole('button', { name: 'Styled' })).toHaveClass(
      expectedClass,
    );
  });

  it('applies the colour to the variant', () => {
    render(
      <Button variant="secondary" color="red">
        Delete
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'border-error-500',
      'text-error-300',
    );
  });

  it('replaces variant colours with disabled styles', () => {
    render(
      <>
        <Button disabled>Primary</Button>
        <Button variant="secondary" disabled>
          Secondary
        </Button>
      </>,
    );

    const primary = screen.getByRole('button', { name: 'Primary' });
    expect(primary).toHaveClass('bg-gray', 'pointer-events-none');
    expect(primary).not.toHaveClass('bg-primary-600');

    const secondary = screen.getByRole('button', { name: 'Secondary' });
    expect(secondary).toHaveClass('bg-transparent', 'border-none');
    expect(secondary).not.toHaveClass('bg-gray');
  });

  it('lets the caller className override conflicting base classes', () => {
    render(<Button className="px-8">Wide</Button>);

    const button = screen.getByRole('button', { name: 'Wide' });
    expect(button).toHaveClass('px-8');
    expect(button).not.toHaveClass('px-4');
  });
});
