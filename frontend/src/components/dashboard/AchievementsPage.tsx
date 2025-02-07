import React from 'react';
import { Trophy, Star, Target, Zap, Award, Crown } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  icon: React.ElementType;
  color: string;
  unlocked: boolean;
  xp: number;
}

export default function AchievementsPage() {
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Task Master',
      description: 'Complete 100 tasks successfully',
      progress: 75,
      total: 100,
      icon: Trophy,
      color: 'blue',
      unlocked: false,
      xp: 500
    },
    {
      id: '2',
      title: 'Knowledge Seeker',
      description: 'Connect 50 concepts in the knowledge graph',
      progress: 45,
      total: 50,
      icon: Star,
      color: 'purple',
      unlocked: false,
      xp: 300
    },
    {
      id: '3',
      title: 'Efficiency Expert',
      description: 'Maintain 95% efficiency rating for 30 days',
      progress: 28,
      total: 30,
      icon: Zap,
      color: 'yellow',
      unlocked: false,
      xp: 400
    },
    {
      id: '4',
      title: 'Team Player',
      description: 'Collaborate with 10 different agents',
      progress: 10,
      total: 10,
      icon: Award,
      color: 'green',
      unlocked: true,
      xp: 250
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
        <p className="text-gray-600">Track your progress and earn rewards</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total XP</p>
              <p className="text-2xl font-bold text-gray-900">12.4K</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Achievements</p>
              <p className="text-2xl font-bold text-gray-900">24/50</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Level</p>
              <p className="text-2xl font-bold text-gray-900">15</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Next Milestone</p>
              <p className="text-2xl font-bold text-gray-900">2.6K</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map(achievement => (
          <div 
            key={achievement.id} 
            className={`
              bg-white rounded-lg shadow-sm border border-gray-200 p-6
              ${achievement.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : ''}
            `}
          >
            <div className="flex items-start gap-4">
              <div className={`
                w-12 h-12 rounded-lg flex items-center justify-center
                ${achievement.unlocked 
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-400'
                  : `bg-${achievement.color}-100`}
              `}>
                {React.createElement(achievement.icon, {
                  className: `w-6 h-6 ${achievement.unlocked ? 'text-white' : `text-${achievement.color}-600`}`
                })}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{achievement.title}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                  {achievement.unlocked && (
                    <div className="flex items-center gap-1 text-yellow-600 text-sm font-medium">
                      <Star className="w-4 h-4" />
                      {achievement.xp} XP
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Progress: {achievement.progress}/{achievement.total}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round((achievement.progress / achievement.total) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`
                        h-full rounded-full transition-all duration-500
                        ${achievement.unlocked
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                          : `bg-${achievement.color}-600`}
                      `}
                      style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                    />
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