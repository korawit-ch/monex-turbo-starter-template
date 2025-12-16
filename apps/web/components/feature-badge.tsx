interface FeatureBadgeProps {
  label: string;
  highlight?: boolean;
}

export function FeatureBadge({ label, highlight }: FeatureBadgeProps) {
  return (
    <span
      className={`px-3 py-1 rounded text-xs font-medium ${
        highlight
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      }`}
    >
      {label}
    </span>
  );
}
