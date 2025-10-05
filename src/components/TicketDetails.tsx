import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { ArrowLeft, Send, Paperclip, Download, Clock, User, AlertCircle } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  ticket_categories: { name: string; resolution_time_hours: number };
  profiles: { full_name: string };
};

type ChatMessage = Database['public']['Tables']['ticket_chat_messages']['Row'] & {
  profiles: { full_name: string; role: string };
};

type Attachment = Database['public']['Tables']['ticket_attachments']['Row'];

interface TicketDetailsProps {
  ticket: Ticket;
  onBack: () => void;
}

export function TicketDetails({ ticket: initialTicket, onBack }: TicketDetailsProps) {
  const { user, profile } = useAuth();
  const [ticket, setTicket] = useState(initialTicket);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTicketDetails();
    fetchMessages();
    fetchAttachments();

    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_chat_messages',
          filter: `ticket_id=eq.${ticket.id}`,
        },
        () => {
          fetchMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticket.id}`,
        },
        () => {
          fetchTicketDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTicketDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          ticket_categories (name, resolution_time_hours),
          profiles!tickets_user_id_fkey (full_name)
        `)
        .eq('id', ticket.id)
        .single();

      if (error) throw error;
      setTicket(data as Ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_chat_messages')
        .select(`
          *,
          profiles (full_name, role)
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as ChatMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments(data);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ticket_chat_messages')
        .insert({
          ticket_id: ticket.id,
          user_id: user.id,
          message: newMessage.trim(),
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
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

  const getTimeRemaining = () => {
    const now = new Date();
    const slaDate = new Date(ticket.sla_due_date);
    const diff = slaDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) {
      return { text: 'SLA Breached', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (hours < 2) {
      return { text: `${hours}h ${minutes}m remaining`, color: 'text-orange-600', bgColor: 'bg-orange-50' };
    } else {
      return { text: `${hours}h ${minutes}m remaining`, color: 'text-green-600', bgColor: 'bg-green-50' };
    }
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">{ticket.ticket_number}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{ticket.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {attachments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments
                  </h3>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Paperclip className="w-5 h-5 text-slate-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{attachment.file_name}</p>
                            <p className="text-xs text-slate-500">
                              {(attachment.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadAttachment(attachment)}
                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Download className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col h-[500px]">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chat</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          message.user_id === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-900 dark:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {message.profiles.full_name}
                          </span>
                          {message.profiles.role === 'it_team' && (
                            <span className="px-1.5 py-0.5 bg-white bg-opacity-20 rounded text-xs">
                              IT
                            </span>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className={`text-xs mt-2 ${
                          message.user_id === user?.id ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading || ticket.status === 'closed'}
                  />
                  <button
                    type="submit"
                    disabled={loading || !newMessage.trim() || ticket.status === 'closed'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Ticket Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Category</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{ticket.ticket_categories.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Created By</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{ticket.profiles.full_name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Created</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
                {ticket.updated_at !== ticket.created_at && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {new Date(ticket.updated_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className={`rounded-xl border p-6 ${timeRemaining.bgColor} border-${timeRemaining.color.replace('text-', '')}`}>
              <div className="flex items-start gap-3">
                <Clock className={`w-5 h-5 ${timeRemaining.color} flex-shrink-0 mt-0.5`} />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">SLA Status</h3>
                  <p className={`text-sm font-semibold ${timeRemaining.color}`}>
                    {timeRemaining.text}
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    Due: {new Date(ticket.sla_due_date).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Expected resolution: {ticket.ticket_categories.resolution_time_hours}h
                  </p>
                </div>
              </div>
            </div>

            {ticket.sla_breached && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-red-900 mb-1">SLA Breached</h3>
                    <p className="text-xs text-red-700">
                      This ticket exceeded the expected resolution time.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
