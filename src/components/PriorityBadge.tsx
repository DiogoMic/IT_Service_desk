interface PriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const baseClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  const priorityConfig: Record<string, { label: string; classes: string }> = {
    low: {
      label: 'Low',
      classes: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    },
    medium: {
      label: 'Medium',
      classes: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500',
    },
    high: {
      label: 'High',
      classes: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    },
    critical: {
      label: 'Critical',
      classes: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400',
    },
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span className={`inline-flex items-center font-medium rounded-md ${baseClasses} ${config.classes}`}>
      {config.label}
    </span>
  );
}
