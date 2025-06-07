/**
 * Helper functions for managing reactions
 */

export interface ReactionCounts {
  HEART: number;
  LIKE: number;
  THUMBS_UP: number;
  THUMBS_DOWN: number;
  total: number;
}

export interface BookWithReactions {
  id: string;
  title: string;
  author?: string;
  cover_url?: string;
  // ... other book fields
  reactions: {
    counts: ReactionCounts;
    userReaction: string | null;
  };
}

/**
 * Toggle a reaction on a book
 */
export async function toggleBookReaction(bookId: string, reactionType: 'HEART' | 'LIKE' | 'THUMBS_UP' | 'THUMBS_DOWN') {
  try {
    const response = await fetch('/api/reactions/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetType: 'BOOK',
        targetId: bookId,
        reactionType: reactionType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to toggle reaction');
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error toggling reaction:', error);
    throw error;
  }
}

/**
 * Fetch all books with their reaction counts
 */
export async function fetchBooksWithReactions(): Promise<BookWithReactions[]> {
  try {
    const response = await fetch('/api/books');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch books');
    }

    const books = await response.json();
    return books;
  } catch (error: any) {
    console.error('Error fetching books:', error);
    throw error;
  }
}

/**
 * Format reaction count for display
 */
export function formatReactionCount(count: number): string {
  if (count === 0) return '';
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}m`;
}

/**
 * Get the emoji for a reaction type
 */
export function getReactionEmoji(reactionType: string): string {
  switch (reactionType) {
    case 'HEART':
      return '❤️';
    case 'LIKE':
      return '👍';
    case 'THUMBS_UP':
      return '👍';
    case 'THUMBS_DOWN':
      return '👎';
    default:
      return '👍';
  }
}

/**
 * Example usage in a React component:
 * 
 * ```tsx
 * import { useState, useEffect } from 'react';
 * import { fetchBooksWithReactions, toggleBookReaction, getReactionEmoji } from '@/lib/reactions';
 * 
 * export function BookCard({ book }: { book: BookWithReactions }) {
 *   const [reactionCounts, setReactionCounts] = useState(book.reactions.counts);
 *   const [userReaction, setUserReaction] = useState(book.reactions.userReaction);
 * 
 *   const handleReaction = async (reactionType: 'HEART' | 'LIKE' | 'THUMBS_UP' | 'THUMBS_DOWN') => {
 *     try {
 *       const result = await toggleBookReaction(book.id, reactionType);
 *       setReactionCounts(result.counts);
 *       setUserReaction(result.action === 'added' ? reactionType : null);
 *     } catch (error) {
 *       console.error('Failed to toggle reaction:', error);
 *     }
 *   };
 * 
 *   return (
 *     <div className="book-card">
 *       <h3>{book.title}</h3>
 *       <p>{book.author}</p>
 *       
 *       <div className="reactions">
 *         {(['HEART', 'LIKE', 'THUMBS_UP', 'THUMBS_DOWN'] as const).map(type => (
 *           <button
 *             key={type}
 *             onClick={() => handleReaction(type)}
 *             className={`reaction-btn ${userReaction === type ? 'active' : ''}`}
 *           >
 *             {getReactionEmoji(type)} {reactionCounts[type]}
 *           </button>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */ 