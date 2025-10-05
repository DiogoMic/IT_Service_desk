import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Bell, Plus, Search, ArrowUp, ArrowDown, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { CreateTicketModal } from './CreateTicketModal';
import { TicketDetails } from './TicketDetails';
import { TicketListView } from './TicketListView';
import { TeamPerformanceView } from './TeamPerformanceView';
import { AnalyticsView } from './AnalyticsView';
import type { Database } from '../lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  ticket_categories: { name: string };
  profiles: { full_name: string; email: string };
  assigned_profile?: { full_name: string } | null;
};

export function NewITDashboard() {
  const { profile } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_categories (name),
        profiles!tickets_user_id_fkey (full_name, email),
        assigned_profile:profiles!tickets_assigned_to_fkey (full_name)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data as Ticket[]);
    }
    setLoading(false);
  };

  const stats = {
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    highPriority: tickets.filter((t) => t.priority === 'high' && t.status !== 'resolved').length,
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const recentActivity = tickets.slice(0, 5);

  if (selectedTicket) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <div className="flex-1 ml-64">
          <TicketDetails
            ticket={selectedTicket}
            onBack={() => {
              setSelectedTicket(null);
              fetchTickets();
            }}
          />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'tickets':
        return (
          <TicketListView
            tickets={tickets}
            onTicketClick={setSelectedTicket}
            onCreateTicket={() => setShowCreateModal(true)}
          />
        );
      case 'team':
        return <TeamPerformanceView tickets={tickets} />;
      case 'analytics':
        return <AnalyticsView tickets={tickets} />;
      case 'dashboard':
      default:
        return (
          <main className="p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400">Welcome back! Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                    <ArrowUp className="w-4 h-4" />
                    <span>2.4%</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.open}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Open Tickets</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Total</div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                    <ArrowDown className="w-4 h-4" />
                    <span>1.8%</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.inProgress}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">In Progress</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">1 avg</div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                    <ArrowUp className="w-4 h-4" />
                    <span>3.5%</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.resolved}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Resolved</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Total</div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                    <ArrowDown className="w-4 h-4" />
                    <span>5.0%</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.highPriority}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">High Priority</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Urgent</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tickets</h2>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create Ticket
                      </button>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === 'all'
                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        All <span className="ml-1 text-xs">{tickets.length}</span>
                      </button>
                      <button
                        onClick={() => setStatusFilter('new')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === 'new'
                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        New
                      </button>
                      <button
                        onClick={() => setStatusFilter('open')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === 'open'
                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => setStatusFilter('in_progress')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === 'in_progress'
                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => setStatusFilter('resolved')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          statusFilter === 'resolved'
                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        Resolved
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Assignee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                              Loading tickets...
                            </td>
                          </tr>
                        ) : filteredTickets.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                              No tickets found
                            </td>
                          </tr>
                        ) : (
                          filteredTickets.slice(0, 10).map((ticket) => (
                            <tr
                              key={ticket.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-slate-900 dark:text-white">{ticket.title}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">#{ticket.ticket_number}</div>
                              </td>
                              <td className="px-6 py-4">
                                <PriorityBadge priority={ticket.priority} size="sm" />
                              </td>
                              <td className="px-6 py-4">
                                {ticket.assigned_profile ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                      {ticket.assigned_profile.full_name.charAt(0)}
                                    </div>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                      {ticket.assigned_profile.full_name}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={ticket.status} size="sm" />
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                  Manage
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Showing {Math.min(10, filteredTickets.length)} of {filteredTickets.length} tickets
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentActivity.map((ticket) => (
                      <div key={ticket.id} className="flex gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">New Ticket</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{ticket.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resolution Rate</h3>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-slate-900 dark:text-white mb-2">95%</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Last 30 days</div>
                    <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-[95%] bg-gradient-to-r from-teal-500 to-emerald-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 ml-64 overflow-auto">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <ThemeToggle />
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{profile?.full_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">IT Team</div>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {renderContent()}
      </div>

      {showCreateModal && <CreateTicketModal onClose={() => setShowCreateModal(false)} onSuccess={fetchTickets} />}
    </div>
  );
}
