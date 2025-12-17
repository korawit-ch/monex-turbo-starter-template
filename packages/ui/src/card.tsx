import { type JSX } from 'react';

export function Card({
  className = '',
  title,
  children,
  href,
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}): JSX.Element {
  return (
    <a
      className={`block p-6 rounded-xl border border-gray-200 bg-white hover:border-primary-500 hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-primary-400 ${className}`}
      href={`${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo"`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-primary-600">
        {title}{' '}
        <span className="inline-block transition-transform group-hover:translate-x-1">
          -&gt;
        </span>
      </h2>
      <p className="text-gray-600 dark:text-gray-300">{children}</p>
    </a>
  );
}
