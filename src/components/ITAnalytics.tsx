import { useState, useEffect } from 'react';
import { api } from '../lib/supabase';
import { TrendingUp, TrendingDown, Award, AlertTriangle, Clock, CheckCircle, Star } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  ticket_categories: { name: string };
  profiles: { full_name: string };
  assigned_profile?: { full_name: string } | null;
};

type Feedback = Database['public']['Tables']['ticket_feedback']['Row'];

interface ITAnalyticsProps {
  tickets: Ticket[];
}

interface ITMemberStats {
  id: string;
  name: string;
  totalTickets: number;
  resolvedTickets: number;
  slaBreached: number;
  slaScore: number;
  avgResolutionTime: number;
}

export function ITAnalytics({ tickets }: ITAnalyticsProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [itMembers, setItMembers] = useState<ITMemberStats[]>([]);

  useEffect(() => {
    fetchFeedback();
    fetchITMembers();
  }, [tickets]);

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_feedback')
        .select('*');

      if (error) throw error;
      setFeedback(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const fetchITMembers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'it_team');

      if (error) throw error;

      const memberStats: ITMemberStats[] = profiles.map(profile => {
        const memberTickets = tickets.filter(t => t.assigned_to === profile.id);
        const resolvedTickets = memberTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
        const breachedTickets = memberTickets.filter(t => t.sla_breached);

        const slaScore = memberTickets.length > 0
          ? ((memberTickets.length - breachedTickets.length) / memberTickets.length) * 100
          : 100;

        const avgResolutionTime = resolvedTickets.length > 0
          ? resolvedTickets.reduce((acc, ticket) => {
              const created = new Date(ticket.created_at).getTime();
              const resolved = new Date(ticket.resolved_at || ticket.closed_at || ticket.updated_at).getTime();
              return acc + (resolved - created) / (1000 * 60 * 60);
            }, 0) / resolvedTickets.length
          : 0;

        return {
          id: profile.id,
          name: profile.full_name,
          totalTickets: memberTickets.length,
          resolvedTickets: resolvedTickets.length,
          slaBreached: breachedTickets.length,
          slaScore,
          avgResolutionTime,
        };
      });

      setItMembers(memberStats.sort((a, b) => b.slaScore - a.slaScore));
    } catch (error) {
      console.error('Error fetching IT members:', error);
    }
  };

  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const slaBreachedCount = tickets.filter(t => t.sla_breached).length;
  const teamSlaScore = totalTickets > 0 ? ((totalTickets - slaBreachedCount) / totalTickets) * 100 : 100;
  const avgRating = feedback.length > 0
    ? feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length
    : 0;

  const categoryStats = tickets.reduce((acc, ticket) => {
    const category = ticket.ticket_categories.name;
    if (!acc[category]) {
      acc[category] = { total: 0, resolved: 0, breached: 0 };
    }
    acc[category].total++;
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      acc[category].resolved++;
    }
    if (ticket.sla_breached) {
      acc[category].breached++;
    }
    return acc;
  }, {} as Record<string, { total: number; resolved: number; breached: number }>);

  const priorityStats = tickets.reduce((acc, ticket) => {
    acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Team SLA Score</p>
            {teamSlaScore >= 90 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{teamSlaScore.toFixed(1)}%</p>
          <p className="text-xs text-slate-500 mt-1">
            {slaBreachedCount} of {totalTickets} tickets breached
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Resolution Rate</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {resolvedTickets} of {totalTickets} resolved
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">Customer Satisfaction</p>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{avgRating.toFixed(1)}/5</p>
          <p className="text-xs text-slate-500 mt-1">
            Based on {feedback.length} feedback{feedback.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600">SLA Breached</p>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{slaBreachedCount}</p>
          <p className="text-xs text-slate-500 mt-1">
            Requires attention
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Category Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(categoryStats).map(([category, stats]) => {
              const resolutionRate = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0;
              const slaRate = stats.total > 0 ? ((stats.total - stats.breached) / stats.total) * 100 : 100;

              return (
                <div key={category} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{category}</p>
                      <p className="text-xs text-slate-500">{stats.total} tickets</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">{resolutionRate.toFixed(0)}% resolved</p>
                      <p className={`text-xs font-medium ${slaRate >= 90 ? 'text-green-600' : 'text-red-600'}`}>
                        {slaRate.toFixed(0)}% SLA
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${resolutionRate}%` }}
                      />
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${slaRate >= 90 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${slaRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Priority Distribution</h3>
          <div className="space-y-4">
            {Object.entries(priorityStats)
              .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2, low: 3 };
                return order[a[0] as keyof typeof order] - order[b[0] as keyof typeof order];
              })
              .map(([priority, count]) => {
                const percentage = totalTickets > 0 ? (count / totalTickets) * 100 : 0;
                const colors = {
                  critical: 'bg-red-500',
                  high: 'bg-orange-500',
                  medium: 'bg-blue-500',
                  low: 'bg-slate-400',
                };

                return (
                  <div key={priority} className="border-b border-slate-100 pb-4 last:border-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{priority}</span>
                      <span className="text-sm text-slate-600">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${colors[priority as keyof typeof colors]} h-full rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">IT Team Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Team Member</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Total Tickets</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Resolved</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">SLA Breached</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">SLA Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Avg. Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {itMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No IT team members with assigned tickets yet
                  </td>
                </tr>
              ) : (
                itMembers.map((member, index) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {index === 0 && member.totalTickets > 0 && (
                          <Award className="w-5 h-5 text-yellow-500" />
                        )}
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{member.name}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-700">{member.totalTickets}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-700">{member.resolvedTickets}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${member.slaBreached > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {member.slaBreached}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 w-24 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              member.slaScore >= 90 ? 'bg-green-500' :
                              member.slaScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${member.slaScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {member.slaScore.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">
                          {member.avgResolutionTime > 0 ? `${member.avgResolutionTime.toFixed(1)}h` : 'N/A'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
