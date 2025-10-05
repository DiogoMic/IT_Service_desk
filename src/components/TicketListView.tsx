import { useState } from 'react';
import { Plus, Filter, ChevronDown } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import type { Database } from '../lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  ticket_categories: { name: string };
  profiles: { full_name: string; email: string };
  assigned_profile?: { full_name: string } | null;
};

interface TicketListViewProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onCreateTicket: () => void;
}

export function TicketListView({ tickets, onTicketClick, onCreateTicket }: TicketListViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    return true;
  });

  const statusCounts = {
    all: tickets.length,
    new: tickets.filter((t) => t.status === 'new').length,
    open: tickets.filter((t) => t.status === 'open').length,
    on_hold: tickets.filter((t) => t.status === 'on_hold').length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Ticket View</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage and track all support tickets</p>
        </div>
        <button
          onClick={onCreateTicket}
          className="flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-lg shadow-teal-600/30"
        >
          <Plus className="w-5 h-5" />
          Create Ticket
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 flex-wrap mb-6">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {status === 'all' ? 'All' : status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                <span className="ml-2 text-xs">{count}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Add Filter</span>
            </div>

            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">Priority: All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">Status: All</option>
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On-Hold</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <button className="text-sm text-teal-600 dark:text-teal-400 hover:underline">
              Reset
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600" />
                </th>
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
                  Created Date
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
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No tickets found
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    onClick={() => onTicketClick(ticket)}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 dark:border-slate-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{ticket.title}</div>
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTicketClick(ticket);
                        }}
                        className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
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
            Showing {filteredTickets.length} tickets
          </div>
        </div>
      </div>
    </div>
  );
}
