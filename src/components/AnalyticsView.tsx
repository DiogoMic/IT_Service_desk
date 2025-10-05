import { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Award } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  ticket_categories: { name: string };
};

interface AnalyticsViewProps {
  tickets: Ticket[];
}

export function AnalyticsView({ tickets }: AnalyticsViewProps) {
  const analytics = useMemo(() => {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentTickets = tickets.filter((t) => new Date(t.created_at) >= last30Days);

    const statusBreakdown = {
      new: tickets.filter((t) => t.status === 'new').length,
      open: tickets.filter((t) => t.status === 'open').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
      on_hold: tickets.filter((t) => t.status === 'on_hold').length,
    };

    const priorityBreakdown = {
      low: tickets.filter((t) => t.priority === 'low').length,
      medium: tickets.filter((t) => t.priority === 'medium').length,
      high: tickets.filter((t) => t.priority === 'high').length,
    };

    const categoryBreakdown = tickets.reduce((acc, ticket) => {
      const category = ticket.ticket_categories?.name || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const slaBreached = tickets.filter((t) => t.sla_breached).length;
    const avgResolutionTime = tickets.filter((t) => t.status === 'resolved').length;
    const resolutionRate =
      tickets.length > 0 ? Math.round((avgResolutionTime / tickets.length) * 100) : 0;

    return {
      statusBreakdown,
      priorityBreakdown,
      categoryBreakdown,
      slaBreached,
      resolutionRate,
      recentTicketsCount: recentTickets.length,
      totalTickets: tickets.length,
    };
  }, [tickets]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Analytics</h1>
        <p className="text-slate-600 dark:text-slate-400">Track performance metrics and identify trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>12%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {analytics.resolutionRate}%
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Resolution Rate</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>8%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {analytics.recentTicketsCount}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Last 30 Days</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex items-center text-sm text-red-600 dark:text-red-400">
              <TrendingDown className="w-4 h-4" />
              <span>3%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {analytics.slaBreached}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">SLA Breached</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {analytics.totalTickets}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Tickets</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Status Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(analytics.statusBreakdown).map(([status, count]) => {
              const percentage =
                analytics.totalTickets > 0 ? Math.round((count / analytics.totalTickets) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Priority Distribution</h3>
          <div className="space-y-4">
            {Object.entries(analytics.priorityBreakdown).map(([priority, count]) => {
              const percentage =
                analytics.totalTickets > 0 ? Math.round((count / analytics.totalTickets) * 100) : 0;
              const colors = {
                low: 'bg-emerald-500',
                medium: 'bg-amber-500',
                high: 'bg-red-500',
              };
              return (
                <div key={priority}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {priority}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[priority as keyof typeof colors]} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Tickets by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(analytics.categoryBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => (
              <div
                key={category}
                className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{count}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{category}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
