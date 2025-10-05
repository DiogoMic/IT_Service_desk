import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Bell, Plus, Search, Clock, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { CreateTicketModal } from './CreateTicketModal';
import { TicketDetails } from './TicketDetails';
import { FeedbackModal } from './FeedbackModal';
import type { Database } from '../lib/database.types';

type TicketType = Database['public']['Tables']['tickets']['Row'] & {
  ticket_categories: { name: string };
  profiles: { full_name: string };
};

export function NewUserDashboard() {
  const { profile, user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [feedbackTicket, setFeedbackTicket] = useState<TicketType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_categories (name),
        profiles!tickets_user_id_fkey (full_name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data as TicketType[]);
    }
    setLoading(false);
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open' || t.status === 'new').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
          <main className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Tickets</h1>
                <p className="text-slate-600 dark:text-slate-400">View and manage all your support tickets</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-lg shadow-teal-600/30"
              >
                <Plus className="w-5 h-5" />
                New Ticket
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">All Tickets</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Ticket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Created
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
                          <div className="flex flex-col items-center gap-3">
                            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                            <p>No tickets yet</p>
                            <button
                              onClick={() => setShowCreateModal(true)}
                              className="text-teal-600 dark:text-teal-400 hover:underline"
                            >
                              Create your first ticket
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((ticket) => (
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
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {ticket.ticket_categories.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <PriorityBadge priority={ticket.priority} size="sm" />
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={ticket.status} size="sm" />
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicket(ticket);
                              }}
                              className="px-3 py-1 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 border border-teal-300 dark:border-teal-600 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredTickets.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          </main>
        );

      case 'dashboard':
      default:
        return (
          <main className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Welcome back, {profile?.full_name?.split(' ')[0]}!
                </h1>
                <p className="text-slate-600 dark:text-slate-400">Track and manage your support tickets</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-lg shadow-teal-600/30"
              >
                <Plus className="w-5 h-5" />
                New Ticket
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.total}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Tickets</div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.open}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Open Tickets</div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.inProgress}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">In Progress</div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.resolved}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Resolved</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Tickets</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Ticket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Created
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
                          <div className="flex flex-col items-center gap-3">
                            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                            <p>No tickets yet</p>
                            <button
                              onClick={() => setShowCreateModal(true)}
                              className="text-teal-600 dark:text-teal-400 hover:underline"
                            >
                              Create your first ticket
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.slice(0, 5).map((ticket) => (
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
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {ticket.ticket_categories.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <PriorityBadge priority={ticket.priority} size="sm" />
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={ticket.status} size="sm" />
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicket(ticket);
                              }}
                              className="px-3 py-1 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 border border-teal-300 dark:border-teal-600 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredTickets.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Showing {Math.min(5, filteredTickets.length)} of {filteredTickets.length} tickets
                    </div>
                    {filteredTickets.length > 5 && (
                      <button
                        onClick={() => setActiveView('tickets')}
                        className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        View all tickets
                      </button>
                    )}
                  </div>
                </div>
              )}
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
                    placeholder="Search your tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <Bell className="w-5 h-5" />
                </button>
                <ThemeToggle />
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{profile?.full_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">User</div>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
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
      {feedbackTicket && (
        <FeedbackModal ticket={feedbackTicket} onClose={() => setFeedbackTicket(null)} onSuccess={fetchTickets} />
      )}
    </div>
  );
}
