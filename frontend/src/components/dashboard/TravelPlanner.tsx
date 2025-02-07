import React, { useState } from 'react';
import { Plane, Map, Calendar, Plus, Clock, Hotel } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TravelPlan {
  id: string;
  destination: string;
  start_date: Date;
  end_date: Date;
  activities: {
    date: Date;
    time: string;
    activity: string;
    location: string;
    notes?: string;
  }[];
  accommodations: {
    name: string;
    check_in: Date;
    check_out: Date;
    confirmation: string;
  }[];
  budget: {
    category: string;
    amount: number;
    spent: number;
  }[];
}

export default function TravelPlanner() {
  const [trips, setTrips] = useState<TravelPlan[]>([]);

  const createTrip = async (plan: Omit<TravelPlan, 'id'>) => {
    try {
      // Create trip plan
      const { data: tripData, error: tripError } = await supabase
        .from('travel_plans')
        .insert({
          ...plan,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // Create AI task for trip optimization
      await supabase.from('agent_interactions').insert({
        agent_id: 'task-coordinator',
        content: `Optimize travel plan to ${plan.destination}`,
        metadata: {
          travel_plan_id: tripData.id,
          dates: {
            start: plan.start_date,
            end: plan.end_date
          },
          activities: plan.activities
        }
      });

      setTrips(prev => [...prev, tripData]);
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Travel Plans</h2>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <Plus className="w-5 h-5" />
          New Trip
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trips.map(trip => (
          <div key={trip.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{trip.destination}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {trip.start_date.toLocaleDateString()} - {trip.end_date.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.ceil((trip.end_date.getTime() - trip.start_date.getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>

              {/* Activities */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Activities</h4>
                <div className="space-y-3">
                  {trip.activities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <Map className="w-4 h-4 mt-1 text-gray-400" />
                      <div>
                        <p className="font-medium">{activity.activity}</p>
                        <p className="text-gray-500">{activity.location}</p>
                        <p className="text-gray-400">
                          {new Date(activity.date).toLocaleDateString()} at {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accommodations */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Accommodations</h4>
                <div className="space-y-3">
                  {trip.accommodations.map((accommodation, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <Hotel className="w-4 h-4 mt-1 text-gray-400" />
                      <div>
                        <p className="font-medium">{accommodation.name}</p>
                        <p className="text-gray-500">
                          Check-in: {accommodation.check_in.toLocaleDateString()}
                        </p>
                        <p className="text-gray-500">
                          Check-out: {accommodation.check_out.toLocaleDateString()}
                        </p>
                        <p className="text-gray-400">
                          Confirmation: {accommodation.confirmation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Budget</h4>
                <div className="space-y-2">
                  {trip.budget.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.category}</span>
                      <div className="text-right">
                        <p className="font-medium">${item.spent} / ${item.amount}</p>
                        <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${(item.spent / item.amount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}