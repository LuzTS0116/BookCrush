'use client';

import React, { useState } from 'react';
import { Button } from './button';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { EllipsisVertical, Loader2, Edit2 } from 'lucide-react';
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
  pastDueTime?: boolean;
  timeInfo?: any;
  dropDelete?: boolean;
  goalStatus?: boolean;
  dropSelect1?: () => void;
  dropSelect2?: () => void;
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
  isDeleting = false, 
  pastDueTime, 
  timeInfo,
  dropDelete,
  goalStatus,
  dropSelect1,
  dropSelect2,

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
      
      {/* 3-dot menu button - positioned absolutely in top right */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center px-1 py-1 rounded-full h-6 w-6 bg-transparent border border-none hover:bg-bookWhite/20"
              disabled={dropDelete}
            >
              {dropDelete ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : (
                <EllipsisVertical className="h-3 w-3 text-secondary/60" />
              )}
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content
            className="w-auto min-w-[120px] rounded-xl bg-bookWhite shadow-xl p-1 border border-gray-200 z-[100]"
            sideOffset={5}
            align="end"
          >
            {pastDueTime && !goalStatus && (
              <DropdownMenu.Item
                onSelect={dropSelect1}
                className="px-3 py-2 text-xs text-center bg-orange-600/90 text-bookWhite rounded-md cursor-pointer hover:bg-orange-500 focus:bg-orange-500 focus:outline-none transition-colors mb-1"
                disabled={dropDelete}
              >
                <Edit2 className="h-3 w-3 mr-1 inline" />
                Edit Goal
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Item
              onSelect={dropSelect2}
              className="px-3 py-2 text-xs text-center bg-red-700/90 text-bookWhite rounded-md cursor-pointer hover:bg-red-600 focus:bg-red-600 focus:outline-none transition-colors"
              disabled={dropDelete}
            >
              Delete Goal
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>

      {/* Achievement Icon */}
      <div className="flex items-start gap-3"> {/* Added pr-8 to give space for the 3-dot button */}
        <div className="flex-1 min-w-0">
          <div className='flex flex-row gap-1'>
            <div className='achievement-icon'>
              {achievement.icon}
            </div>
            <div className="flex-1">
              {/* Achievement Name & Points */}
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold text-sm/4 ${isEarned ? 'text-gray-900' : 'text-gray-600'}`}>
                  Reading Goal
                </h3>
              </div>

              {/* Achievement Description */}
              <p className={`text-xs/3 ${isEarned ? 'text-gray-700' : 'text-gray-500'}`}>
                {achievement.description}
              </p>

              {/* Time remaining information - now inside the card bg-accent-variant/20 text-gray-500 */}
              {timeInfo && !goalStatus && (
                <div className={`text-xs font-medium mb-1 inline-block rounded-full px-2 ${
                  pastDueTime ? 'bg-accent/20 text-red-400' : 'bg-accent-variant/20 text-gray-500'
                }`}>
                  {timeInfo.text}
                </div>
              )}
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
                  <div className="flex-1 h-3 bg-secondary/10 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary-dark to-accent h-full transition-all duration-300"
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
        <div className="absolute top-[10px] right-8">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
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