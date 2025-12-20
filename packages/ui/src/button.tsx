'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from './utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Button Component
 * A simple button component with basic styling
 *
 * @example
 * <Button onClick={handleClick}>Click me</Button>
 * <Button disabled>Disabled</Button>
 */
export const Button = ({
  children,
  className = '',
  onClick,
  disabled = false,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all duration-200',
        'bg-primary-600 text-white hover:bg-primary-700',
        'disabled:bg-gray disabled:text-medium-gray disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
