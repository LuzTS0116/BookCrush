'use client';

import React from 'react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  difficulty: string;
  points: number;
  earned_at?: string;
  current_value?: number;
  target_value?: number;
  progress_percentage?: number;
}

interface AchievementCardProps {
  achievement: Achievement;
  isEarned?: boolean;
  showProgress?: boolean;
}

const difficultyColors = {
  BRONZE: 'bg-amber-100 text-amber-800 border-amber-200',
  SILVER: 'bg-gray-100 text-gray-800 border-gray-200',
  GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PLATINUM: 'bg-purple-100 text-purple-800 border-purple-200',
  DIAMOND: 'bg-blue-100 text-blue-800 border-blue-200',
};

const categoryColors = {
  READING_MILESTONE: 'bg-green-50 border-green-200',
  RECOMMENDER: 'bg-pink-50 border-pink-200',
  GENRE_EXPLORER: 'bg-indigo-50 border-indigo-200',
  SOCIAL_BUTTERFLY: 'bg-orange-50 border-orange-200',
  CLUB_PARTICIPANT: 'bg-cyan-50 border-cyan-200',
  REVIEWER: 'bg-teal-50 border-teal-200',
  SPECIAL: 'bg-red-50 border-red-200',
};

export function AchievementCard({ achievement, isEarned = false, showProgress = false }: AchievementCardProps) {
  const difficultyColorClass = difficultyColors[achievement.difficulty as keyof typeof difficultyColors] || difficultyColors.BRONZE;
  const categoryColorClass = categoryColors[achievement.category as keyof typeof categoryColors] || 'bg-gray-50 border-gray-200';

  return (
    <div className={`relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
      isEarned ? 'bg-white border-green-300 shadow-sm' : `${categoryColorClass} opacity-75`
    }`}>
      {/* Achievement Icon */}
      <div className="flex items-start gap-3">
        <div className={`text-2xl p-2 rounded-full ${isEarned ? 'bg-green-100' : 'bg-gray-100'}`}>
          {achievement.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Achievement Name & Points */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={`font-semibold text-sm ${isEarned ? 'text-gray-900' : 'text-gray-600'}`}>
              {achievement.name}
            </h3>
            <span className="text-xs font-medium text-gray-500">
              {achievement.points} pts
            </span>
          </div>

          {/* Achievement Description */}
          <p className={`text-xs mb-2 ${isEarned ? 'text-gray-700' : 'text-gray-500'}`}>
            {achievement.description}
          </p>

          {/* Difficulty Badge */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${difficultyColorClass}`}>
              {achievement.difficulty}
            </span>

            {/* Earned Date or Progress */}
            {isEarned && achievement.earned_at ? (
              <span className="text-xs text-green-600 font-medium">
                ✓ Earned {new Date(achievement.earned_at).toLocaleDateString()}
              </span>
            ) : (
              (showProgress || (achievement.current_value !== undefined && achievement.target_value !== undefined)) && (
                <div className="text-right">
                  <div className="text-xs text-gray-600">
                    {achievement.current_value || 0}/{achievement.target_value || 0}
                  </div>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${achievement.progress_percentage || 0}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Earned Overlay */}
      {isEarned && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
} 