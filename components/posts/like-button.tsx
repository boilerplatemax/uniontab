'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LikeButtonProps {
  postId: number;
  initialLiked: boolean;
  initialCount: number;
  userId: number | null;
}

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
  userId,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (!userId) {
      // Redirect to login if not authenticated
      window.location.href = `/login?redirect=${window.location.pathname}`;
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      setIsLiked(data.isLiked);
      setLikeCount(data.likeCount);
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Failed to update like');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <Heart
        className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
      />
      <span className="text-sm text-gray-600">
        {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
      </span>
    </Button>
  );
}
