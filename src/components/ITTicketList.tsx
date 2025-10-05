import { useState } from 'react';
import { api } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Ticket, AlertCircle, User, Mail } from 'lucide-react';
import { TicketDetails } from './TicketDetails';
import type { Database } from '../lib/database.types';

type TicketType = Database['public']['Tables']['tickets']['Row'] & {
  ticket_categories: { name: string };
  profiles: { full_name: string; email: string };
  assigned_profile?: { full_name: string } | null;
};

interface ITTicketListProps {
  tickets: TicketType[];
  loading: boolean;
  onRefresh: () => void;
}

export function ITTicketList({ tickets, loading, onRefresh }: ITTicketListProps) {
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved' | 'closed'>('all');

  const handleAssignToMe = async (ticketId: string) => {
    if (!user) return;
    setAssigningTicketId(ticketId);

    try {
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ assigned_to: user.id })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      const { error: assignmentError } = await supabase
        .from('ticket_assignments')
        .insert({
          ticket_id: ticketId,
          assigned_to: user.id,
          assigned_by: user.id,
        });

      if (assignmentError) throw assignmentError;

      onRefresh();
    } catch (error) {
      console.error('Error assigning ticket:', error);
    } finally {
      setAssigningTicketId(null);
    }
  };

  const handleCloseTicket = async (ticketId: string, ticket: TicketType) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);

      if (error) throw error;

      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-feedback-request`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketId: ticket.id,
            ticketNumber: ticket.ticket_number,
            title: ticket.title,
            userEmail: ticket.profiles.email,
            userName: ticket.profiles.full_name,
          }),
        });
      } catch (notifError) {
        console.error('Error sending feedback request:', notifError);
      }

      onRefresh();
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'resolved' })
        .eq('id', ticketId);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error resolving ticket:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const stats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === 'new').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    slaBreached: tickets.filter(t => t.sla_breached).length,
  };

  if (selectedTicket) {
    return <TicketDetails ticket={selectedTicket} onBack={() => { setSelectedTicket(null); onRefresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 mb-1">Total</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 mb-1">New</p>
          <p className="text-3xl font-bold text-blue-600">{stats.new}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 mb-1">In Progress</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 mb-1">Resolved</p>
          <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 mb-1">SLA Breached</p>
          <p className="text-3xl font-bold text-red-600">{stats.slaBreached}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-wrap gap-2">
            {(['all', 'new', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'All Tickets' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No tickets found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Ticket #</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="font-mono text-sm text-blue-600 font-medium hover:underline"
                      >
                        {ticket.ticket_number}
                      </button>
                      {ticket.sla_breached && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-red-600" />
                          <span className="text-xs text-red-600 font-medium">SLA</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{ticket.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{ticket.profiles.full_name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {ticket.profiles.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-700">{ticket.ticket_categories.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.assigned_profile ? (
                        <span className="text-sm text-slate-700">{ticket.assigned_profile.full_name}</span>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {!ticket.assigned_to && ticket.status === 'new' && (
                          <button
                            onClick={() => handleAssignToMe(ticket.id)}
                            disabled={assigningTicketId === ticket.id}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {assigningTicketId === ticket.id ? 'Assigning...' : 'Assign to Me'}
                          </button>
                        )}
                        {ticket.status === 'in_progress' && (
                          <button
                            onClick={() => handleResolveTicket(ticket.id)}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                        {ticket.status === 'resolved' && (
                          <button
                            onClick={() => handleCloseTicket(ticket.id, ticket)}
                            className="px-3 py-1.5 bg-slate-600 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
