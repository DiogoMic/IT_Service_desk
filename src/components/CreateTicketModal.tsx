import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { X, Upload, File, AlertCircle } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Category = Database['public']['Tables']['ticket_categories']['Row'];

interface CreateTicketModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTicketModal({ onClose, onSuccess }: CreateTicketModalProps) {
  const { user, profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data);
      if (data.length > 0) setCategoryId(data[0].id);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setError('');
    setLoading(true);

    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          title,
          description,
          priority,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      if (files.length > 0 && ticket) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${ticket.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
          } else {
            await supabase.from('ticket_attachments').insert({
              ticket_id: ticket.id,
              file_name: file.name,
              file_path: fileName,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: user.id,
            });
          }
        }
      }

      if (ticket) {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-ticket-created`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticketId: ticket.id,
              ticketNumber: ticket.ticket_number,
              title: ticket.title,
              userEmail: profile.email,
              userName: profile.full_name,
            }),
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Ticket</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Provide detailed information about your issue..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Attachments
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-10 h-10 text-slate-400" />
                <span className="text-sm text-slate-600">
                  Click to upload files or drag and drop
                </span>
                <span className="text-xs text-slate-500">
                  Screenshots, documents, logs, etc.
                </span>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-slate-200 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
