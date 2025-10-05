interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const baseClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  const statusConfig: Record<string, { label: string; classes: string }> = {
    new: {
      label: 'New',
      classes: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
    },
    open: {
      label: 'Open',
      classes: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    },
    in_progress: {
      label: 'In Progress',
      classes: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    },
    pending: {
      label: 'Pending',
      classes: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    },
    on_hold: {
      label: 'On-Hold',
      classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    },
    resolved: {
      label: 'Resolved',
      classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    },
    closed: {
      label: 'Closed',
      classes: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    },
  };

  const config = statusConfig[status] || statusConfig.new;

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${baseClasses} ${config.classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {config.label}
    </span>
  );
}
