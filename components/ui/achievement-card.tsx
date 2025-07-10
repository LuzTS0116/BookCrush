'use client';

import React, { useState } from 'react';
import { Button } from './button';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { EllipsisVertical, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

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
  onDelete?: (achievementId: string) => void;
  showDeleteButton?: boolean;
  isDeleting?: boolean;
}

const difficultyColors = {
  BRONZE: 'bg-amber-100 text-amber-800 border-amber-200',
  SILVER: 'bg-gray-100 text-gray-800 border-gray-200',
  GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PLATINUM: 'bg-purple-100 text-purple-800 border-purple-200',
  DIAMOND: 'bg-blue-100 text-blue-800 border-blue-200',
};

const categoryColors = {
  READING_MILESTONE: 'bg-bookWhite border-accent-variant',
  RECOMMENDER: 'bg-pink-50 border-pink-200',
  GENRE_EXPLORER: 'bg-indigo-50 border-indigo-200',
  SOCIAL_BUTTERFLY: 'bg-orange-50 border-orange-200',
  CLUB_PARTICIPANT: 'bg-cyan-50 border-cyan-200',
  REVIEWER: 'bg-teal-50 border-teal-200',
  SPECIAL: 'bg-red-50 border-red-200',
};

export function AchievementCard({ 
  achievement, 
  isEarned = false, 
  showProgress = false, 
  onDelete, 
  showDeleteButton = false,
  isDeleting = false 
}: AchievementCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const difficultyColorClass = difficultyColors[achievement.difficulty as keyof typeof difficultyColors] || difficultyColors.BRONZE;
  const categoryColorClass = categoryColors[achievement.category as keyof typeof categoryColors] || 'bg-gray-50 border-gray-200';

  const handleDelete = () => {
    if (onDelete) {
      onDelete(achievement.id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <div className={`relative p-2.5 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
      isEarned ? 'bg-bookWhite border-green-300 shadow-sm' : `${categoryColorClass} opacity-90`
    }`}>
      {/* Achievement Icon */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className='flex flex-row gap-1'>
            <div className='achievement-icon'>
              {achievement.icon}
            </div>
            <div>
              {/* Achievement Name & Points */}
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold text-sm ${isEarned ? 'text-gray-900' : 'text-gray-600'}`}>
                  Reading Goal
                </h3>
              </div>

              {/* Achievement Description */}
              <p className={`text-xs mb-1 ${isEarned ? 'text-gray-700' : 'text-gray-500'}`}>
                {achievement.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Earned Date or Progress */}
            {isEarned && achievement.earned_at ? (
              <span className="text-xs text-green-600 font-medium">
                ✓ Earned {new Date(achievement.earned_at).toLocaleDateString()}
              </span>
            ) : (
              (showProgress || (achievement.current_value !== undefined && achievement.target_value !== undefined)) && (
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-variant transition-all duration-300"
                      style={{ width: `${achievement.progress_percentage || 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 flex-shrink-0">
                    {achievement.current_value || 0}/{achievement.target_value || 0}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Delete Button */}
      {showDeleteButton && (
        <div className="absolute bottom-2 right-2">
          <Button
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
            size="sm"
            variant="destructive"
            className="h-6 px-2 text-xs"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      )}

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[85vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Reading Goal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reading goal? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-gray-600">
              <strong>{achievement.name}:</strong> {achievement.description}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 