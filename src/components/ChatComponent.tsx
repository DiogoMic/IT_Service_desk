import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface Message {
  id: string;
  message: string;
  user_name: string;
  role: string;
  created_at: string;
}

interface ChatComponentProps {
  ticketId: string;
  onNewMessage?: () => void;
}

export function ChatComponent({ ticketId, onNewMessage }: ChatComponentProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          user_id: user?.uid,
          message: newMessage.trim()
        })
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
        onNewMessage?.();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Chat</h3>
        </div>
      </div>

      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'it_team' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'it_team'
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'bg-teal-600 text-white'
                }`}
              >
                <div className="text-xs opacity-75 mb-1">
                  {message.user_name} • {new Date(message.created_at).toLocaleTimeString()}
                </div>
                <div className="text-sm">{message.message}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || loading}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}