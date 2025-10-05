import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/supabase';
import { LogOut, Users, TrendingUp } from 'lucide-react';
import { ITTicketList } from './ITTicketList';
import { ITAnalytics } from './ITAnalytics';
import { ThemeToggle } from './ThemeToggle';
import type { Database } from '../lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  ticket_categories: { name: string };
  profiles: { full_name: string; email: string };
  assigned_profile?: { full_name: string } | null;
};

export function ITDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'tickets' | 'analytics'>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel('it-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_categories (name),
          profiles!tickets_user_id_fkey (full_name, email),
          assigned_profile:profiles!tickets_assigned_to_fkey (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data as Ticket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <span className="text-xl">🎫</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">IT Service Desk</h1>
                <p className="text-xs text-slate-600">IT Team Portal - {profile?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'tickets'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              Ticket Management
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-white'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Analytics & Reports
            </button>
          </div>
        </div>

        {activeTab === 'tickets' ? (
          <ITTicketList tickets={tickets} loading={loading} onRefresh={fetchTickets} />
        ) : (
          <ITAnalytics tickets={tickets} />
        )}
      </div>
    </div>
  );
}
