import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface FeedbackFormProps {
  ticketId: string;
  ticketNumber: string;
  onSubmit?: () => void;
}

export function FeedbackForm({ ticketId, ticketNumber, onSubmit }: FeedbackFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = async () => {
    if (rating === 0 || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          user_id: user?.uid,
          rating,
          comments: comments.trim()
        })
      });

      if (response.ok) {
        setSubmitted(true);
        onSubmit?.();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-green-600 dark:text-green-400 fill-current" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Thank You for Your Feedback!
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Your feedback helps us improve our service quality.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Rate Your Experience
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          How satisfied are you with the resolution of ticket #{ticketNumber}?
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-colors"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {rating === 0 && 'Please select a rating'}
          {rating === 1 && 'Very Dissatisfied'}
          {rating === 2 && 'Dissatisfied'}
          {rating === 3 && 'Neutral'}
          {rating === 4 && 'Satisfied'}
          {rating === 5 && 'Very Satisfied'}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Additional Comments (Optional)
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Tell us more about your experience..."
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          rows={4}
        />
      </div>

      <button
        onClick={submitFeedback}
        disabled={rating === 0 || loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  );
}