import { LayoutDashboard, Ticket, Users, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface SidebarProps {
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export function Sidebar({ activeView = 'dashboard', onViewChange }: SidebarProps) {
  const { signOut, profile } = useAuth();

  const isITTeam = profile?.role === 'it_team';

  const menuItems = isITTeam
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'tickets', label: 'My Tickets', icon: Ticket },
        { id: 'team', label: 'Team Performance', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'tickets', label: 'My Tickets', icon: Ticket },
      ];

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">ServiceDesk</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Support Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange?.(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
