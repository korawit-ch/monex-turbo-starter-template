'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button = ({
  children,
  className = '',
  appName,
  variant = 'primary',
}: ButtonProps) => {
  const baseStyles =
    'inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer';

  const variantStyles = {
    primary:
      'bg-black text-white hover:bg-gray-800 active:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200',
    secondary:
      'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    outline:
      'border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={() => alert(`Hello from your ${appName} app!`)}
    >
      {children}
    </button>
  );
};
