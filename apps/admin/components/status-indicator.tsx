interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'syncing';
  label: string;
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    syncing: 'bg-yellow-500',
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
      <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
      {label}
    </div>
  );
}
