import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { Button, Card } from '../design/DesignSystem';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface FeedbackWidgetProps {
  taskId?: string;
  agentId?: string;
  type?: 'task' | 'agent' | 'system';
}

export default function FeedbackWidget({ taskId, agentId, type = 'task' }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          type,
          task_id: taskId,
          agent_id: agentId,
          rating,
          comment,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      setIsOpen(false);
      setRating(null);
      setComment('');

      logger.info({ 
        type,
        taskId,
        agentId,
        rating 
      }, 'Feedback submitted successfully');

    } catch (error) {
      logger.error({ error }, 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        icon={<MessageSquare className="w-4 h-4" />}
      >
        Give Feedback
      </Button>
    );
  }

  return (
    <Card className="w-80">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Your Feedback</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-neutral-400 hover:text-neutral-500"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Rating */}
        <div className="flex justify-center gap-4">
          <Button
            variant={rating === 1 ? 'primary' : 'outline'}
            onClick={() => setRating(1)}
            icon={<ThumbsDown className="w-5 h-5" />}
          >
            Needs Improvement
          </Button>
          <Button
            variant={rating === 5 ? 'primary' : 'outline'}
            onClick={() => setRating(5)}
            icon={<ThumbsUp className="w-5 h-5" />}
          >
            Great Job
          </Button>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Additional Comments
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="Tell us more about your experience..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!rating}
            icon={<Send className="w-4 h-4" />}
          >
            Submit Feedback
          </Button>
        </div>
      </div>
    </Card>
  );
}