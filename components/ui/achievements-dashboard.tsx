'use client';

import React, { useState, useEffect } from 'react';
import { AchievementCard } from './achievement-card';
import { useSession } from 'next-auth/react';

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

interface AchievementsData {
  earned: Achievement[];
  in_progress: Achievement[];
}

export function AchievementsDashboard() {
  const { data: session } = useSession();
  const [achievements, setAchievements] = useState<AchievementsData>({ earned: [], in_progress: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'earned' | 'progress'>('all');

  useEffect(() => {
    if (session?.supabaseAccessToken) {
      fetchAchievements();
    }
  }, [session?.supabaseAccessToken]);

  const fetchAchievements = async () => {
    if (!session?.supabaseAccessToken) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const authHeaders = {
        'Authorization': `Bearer ${session.supabaseAccessToken}`,
        'Content-Type': 'application/json',
      };
      
      // Fetch regular achievements and custom goals in parallel
      const [achievementsResponse, customGoalsResponse] = await Promise.all([
        fetch('/api/achievements', { headers: authHeaders }),
        fetch('/api/achievements/custom-goals', { headers: authHeaders })
      ]);
      
      if (!achievementsResponse.ok) {
        throw new Error('Failed to fetch achievements');
      }
      
      const achievementsData = await achievementsResponse.json();
      let customGoalsData = [];
      
      // Custom goals are optional, don't fail if they can't be fetched
      if (customGoalsResponse.ok) {
        customGoalsData = await customGoalsResponse.json();
      }
      
      // Transform custom goals to match achievement format
      const transformedCustomGoals = customGoalsData.map((goal: any) => ({
        id: goal.id,
        name: goal.name,
        description: goal.description,
        icon: '🎯',
        category: 'READING_MILESTONE',
        difficulty: 'GOLD',
        points: 0,
        current_value: goal.progress.current_value,
        target_value: goal.progress.target_value,
        progress_percentage: goal.progress.progress_percentage,
        is_custom_goal: true,
        earned_at: goal.earned_at
      }));
      
      // Merge achievements with custom goals
      const mergedEarned = [
        ...achievementsData.earned,
        ...transformedCustomGoals.filter((goal: any) => goal.earned_at)
      ];
      
      const mergedInProgress = [
        ...achievementsData.in_progress,
        ...transformedCustomGoals.filter((goal: any) => !goal.earned_at)
      ];
      
      setAchievements({
        earned: mergedEarned,
        in_progress: mergedInProgress
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = achievements.earned.reduce((sum, achievement) => sum + achievement.points, 0);
  const totalEarned = achievements.earned.length;
  const totalInProgress = achievements.in_progress.length;

  const getFilteredAchievements = () => {
    switch (activeTab) {
      case 'earned':
        return { earned: achievements.earned, in_progress: [] };
      case 'progress':
        return { earned: [], in_progress: achievements.in_progress };
      default:
        return achievements;
    }
  };

  const filteredAchievements = getFilteredAchievements();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading achievements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">Error loading achievements</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button 
          onClick={fetchAchievements}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievements</h1>
        <p className="text-gray-600">Track your reading milestones and social activities</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{totalEarned}</div>
          <div className="text-blue-100">Achievements Earned</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{totalPoints}</div>
          <div className="text-green-100">Total Points</div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="text-2xl font-bold">{totalInProgress}</div>
          <div className="text-orange-100">In Progress</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All Achievements' },
          { key: 'earned', label: `Earned (${totalEarned})` },
          { key: 'progress', label: `In Progress (${totalInProgress})` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="space-y-6">
        {/* Earned Achievements */}
        {filteredAchievements.earned.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🏆</span>
              Earned Achievements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.earned.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isEarned={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* In Progress Achievements */}
        {filteredAchievements.in_progress.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⏳</span>
              In Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.in_progress.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isEarned={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredAchievements.earned.length === 0 && filteredAchievements.in_progress.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No achievements yet</h3>
            <p className="text-gray-600 mb-4">
              Start reading books and sending recommendations to earn your first achievements!
            </p>
            <button 
              onClick={fetchAchievements}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Achievement Categories Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Achievement Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-200 rounded mr-2"></div>
            <span>Reading Milestones</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-pink-200 rounded mr-2"></div>
            <span>Recommendations</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-indigo-200 rounded mr-2"></div>
            <span>Genre Explorer</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-teal-200 rounded mr-2"></div>
            <span>Reviews</span>
          </div>
        </div>
      </div>
    </div>
  );
} 