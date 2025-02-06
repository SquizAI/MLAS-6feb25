import React, { useState } from 'react';
import { Calendar, Clock, Bell, Plus, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: Date;
  end_time: Date;
  category: 'family' | 'personal' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  reminders: number[]; // Minutes before event
}

export default function ScheduleManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const addEvent = async (event: Omit<Event, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...event,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create AI task for event management
      await supabase.from('agent_interactions').insert({
        agent_id: 'task-coordinator',
        content: `Manage event: ${event.title}`,
        metadata: {
          event_id: data.id,
          reminders: event.reminders,
          priority: event.priority
        }
      });

      setEvents(prev => [...prev, data]);
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Schedule Manager</h2>
        <button
          onClick={() => setShowAddEvent(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Calendar implementation */}
      </div>

      {/* Upcoming Events */}
      <div className="space-y-4">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{event.title}</h3>
                <p className="text-sm text-gray-600">{event.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {event.start_time.toLocaleTimeString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {event.category}
                  </div>
                  <div className="flex items-center gap-1">
                    <Bell className="w-4 h-4" />
                    {event.reminders.length} reminders
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}