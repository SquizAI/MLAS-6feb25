import React from 'react';
import { Award, Star } from 'lucide-react';

export default function XPProgress() {
  const achievements = [
    {
      id: '1',
      title: 'Task Master',
      description: 'Completed 100 tasks successfully',
      progress: 75,
      icon: Award,
    },
    {
      id: '2',
      title: 'Knowledge Seeker',
      description: 'Connected 50 concepts in knowledge graph',
      progress: 90,
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Level 15</span>
          <span className="text-sm text-gray-600">12,450 / 15,000 XP</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-blue-600 rounded-full"
            style={{ width: '83%' }}
          />
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="space-y-4">
        {achievements.map(achievement => {
          const Icon = achievement.icon;
          return (
            <div key={achievement.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-yellow-500" />
                <div>
                  <h4 className="font-medium">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${achievement.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}