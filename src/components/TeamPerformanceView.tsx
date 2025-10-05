import { useState, useEffect } from 'react';
import { api } from '../lib/supabase';
import { TrendingUp, Award, Clock } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  totalTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  resolutionRate: number;
  pendingTickets: number;
}

interface TeamPerformanceViewProps {
  tickets: Ticket[];
}

export function TeamPerformanceView({ tickets }: TeamPerformanceViewProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamPerformance();
  }, [tickets]);

  const fetchTeamPerformance = async () => {
    setLoading(true);

    const { data: itMembers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'it_team');

    if (error || !itMembers) {
      setLoading(false);
      return;
    }

    const membersWithStats: TeamMember[] = itMembers.map((member) => {
      const memberTickets = tickets.filter((t) => t.assigned_to === member.id);
      const resolvedTickets = memberTickets.filter((t) => t.status === 'resolved');
      const pendingTickets = memberTickets.filter(
        (t) => t.status !== 'resolved' && t.status !== 'closed'
      );

      const avgResponseTime = memberTickets.length > 0
        ? memberTickets.reduce((acc, ticket) => {
            const created = new Date(ticket.created_at).getTime();
            const updated = new Date(ticket.updated_at).getTime();
            return acc + (updated - created) / (1000 * 60 * 60);
          }, 0) / memberTickets.length
        : 0;

      const resolutionRate = memberTickets.length > 0
        ? (resolvedTickets.length / memberTickets.length) * 100
        : 0;

      return {
        id: member.id,
        full_name: member.full_name,
        email: member.email,
        totalTickets: memberTickets.length,
        resolvedTickets: resolvedTickets.length,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        resolutionRate: Math.round(resolutionRate),
        pendingTickets: pendingTickets.length,
      };
    });

    setTeamMembers(membersWithStats.sort((a, b) => b.resolutionRate - a.resolutionRate));
    setLoading(false);
  };

  const topPerformer = teamMembers[0];
  const avgResolutionRate = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((acc, m) => acc + m.resolutionRate, 0) / teamMembers.length)
    : 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Team Performance</h1>
        <p className="text-slate-600 dark:text-slate-400">Monitor team efficiency and identify bottlenecks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{avgResolutionRate}%</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Avg Resolution Rate</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{teamMembers.length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Active Agents</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {topPerformer ? `${topPerformer.avgResponseTime}h` : 'N/A'}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Avg Response Time</div>
        </div>
      </div>

      {topPerformer && (
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Top Performer</div>
              <div className="text-2xl font-bold">{topPerformer.full_name}</div>
              <div className="text-sm opacity-90">{topPerformer.resolutionRate}% resolution rate</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Agent Performance</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Avg Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Resolution Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Pending Tickets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Resolved
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    Loading team performance...
                  </td>
                </tr>
              ) : teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No team members found
                  </td>
                </tr>
              ) : (
                teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{member.full_name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                      {member.avgResponseTime} hours
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {member.resolutionRate}%
                        </div>
                        <div className="flex-1 max-w-[100px] h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              member.resolutionRate >= 90
                                ? 'bg-emerald-500'
                                : member.resolutionRate >= 70
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${member.resolutionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{member.pendingTickets}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{member.resolvedTickets}</td>
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
