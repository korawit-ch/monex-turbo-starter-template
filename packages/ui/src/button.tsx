'use client';

import { forwardRef, type ReactNode } from 'react';

import { cn } from './utils';

export type ButtonSize = 'large' | 'small';
export type ButtonVariant = 'primary' | 'secondary' | 'linked' | 'textlink';
export type ButtonColor = 'primary' | 'yellow' | 'red';

const sizeStyles: Record<ButtonSize, string> = {
  large: 'h-14 md:h-12 text-mobile-body1 md:text-desktop-body1',
  small: 'h-10 md:h-10 text-mobile-body2 md:text-desktop-body2',
};

const colorStyles = {
  primary: {
    bg: 'bg-primary-600',
    border: 'border-primary-700',
    bgHover: 'hover:bg-primary-700',
    borderHover: 'hover:border-primary-800',
    borderWidth: 'border',
    text: 'text-white',
    textLink: 'text-primary-600',
    textLinkHover: 'hover:text-primary-700',
  },
  yellow: {
    bg: 'bg-warning-300',
    border: 'border-warning-800',
    bgHover: 'hover:bg-warning-500',
    borderHover: 'hover:border-warning-800',
    borderWidth: 'border-2',
    text: 'text-darkest-gray',
    textLink: 'text-warning-500',
    textLinkHover: 'hover:text-warning-800',
  },
  red: {
    bg: 'bg-error-300',
    border: 'border-error-500',
    bgHover: 'hover:bg-error-500',
    borderHover: 'hover:border-error-800',
    borderWidth: 'border-2',
    text: 'text-white',
    textLink: 'text-error-300',
    textLinkHover: 'hover:text-error-500',
  },
} satisfies Record<ButtonColor, Record<string, string>>;

function getVariantStyles(
  variant: ButtonVariant,
  color: ButtonColor,
  disabled: boolean,
) {
  const colors = colorStyles[color];
  const disabledStyles =
    'border-medium-gray text-medium-gray pointer-events-none cursor-not-allowed border bg-gray hover:border-medium-gray hover:bg-gray';

  if (disabled) {
    return variant === 'primary'
      ? disabledStyles
      : cn(disabledStyles, 'border-none bg-transparent hover:bg-transparent');
  }

  const variants: Record<ButtonVariant, string> = {
    primary: cn(
      colors.bg,
      colors.bgHover,
      colors.text,
      colors.border,
      colors.borderHover,
      colors.borderWidth,
    ),
    secondary: cn(
      'bg-transparent',
      colors.border,
      colors.borderHover,
      colors.borderWidth,
      colors.textLink,
      colors.textLinkHover,
    ),
    linked: cn(
      'border-none bg-transparent',
      colors.textLink,
      colors.textLinkHover,
    ),
    textlink: cn(
      'border-none bg-transparent underline',
      colors.textLink,
      colors.textLinkHover,
    ),
  };

  return variants[variant];
}

/**
 * Button Component
 *
 * @example
 * <Button variant="primary">Click me</Button>
 * <Button startIcon={<Icon />}>Text</Button>
 * <Button variant="secondary" color="primary">Text</Button>
 * <Button variant="primary" color="yellow" size="small">Text</Button>
 * <Button variant="linked" href="/page">Text</Button>
 * <Button variant="textlink" href="/page">Text</Button>
 * <Button variant="primary" disabled>Text</Button>
 *
 * @example With Next.js Link
 * ```tsx
 * import Link from 'next/link';
 * import { Button } from '@repo/ui/button';
 *
 * <Button variant="linked" href="/page" as={Link}>
 *   Go to Page
 * </Button>
 * ```
 */
export interface ButtonProps {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  /**
   * Optional component to render instead of <a> for links
   * Useful for Next.js Link: as={Link}
   * @example
   * ```tsx
   * import Link from 'next/link';
   * <Button variant="linked" href="/page" as={Link}>Go to Page</Button>
   * ```
   */
  as?: React.ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
}

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'large',
      color = 'primary',
      startIcon,
      endIcon,
      onClick,
      disabled = false,
      href,
      type = 'button',
      as: LinkComponent,
    },
    ref,
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center gap-2 px-4 py-[9px] rounded-lg font-medium transition-all duration-200 cursor-pointer',
      sizeStyles[size],
    );

    const variantStyles = getVariantStyles(variant, color, disabled);

    const content = (
      <>
        {startIcon && <span aria-hidden="true">{startIcon}</span>}
        {children}
        {endIcon && <span aria-hidden="true">{endIcon}</span>}
      </>
    );

    if (href) {
      const LinkElement = LinkComponent || 'a';
      return (
        <LinkElement
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          href={href}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          className={cn(baseStyles, variantStyles, className)}
          onClick={disabled ? (event) => event.preventDefault() : onClick}
        >
          {content}
        </LinkElement>
      );
    }

    return (
      <button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        type={type}
        className={cn(baseStyles, variantStyles, className)}
        onClick={onClick}
        disabled={disabled}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = 'Button';
