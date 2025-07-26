'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/use-session';

interface LikeButtonProps {
    postId: string;
    initialLiked: boolean;
    initialCount: number;
    onLikeChange?: (liked: boolean, newCount: number) => void;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
}

export default function LikeButton({
    postId,
    initialLiked,
    initialCount,
    onLikeChange,
    size = 'md',
    showCount = true
}: LikeButtonProps) {
    const { data: session, isAuthenticated } = useSession();
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [likeCount, setLikeCount] = useState(initialCount);
    const [isLoading, setIsLoading] = useState(false);

    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    const handleLike = async () => {
        if (!isAuthenticated || isLoading) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/posts/${postId}/like`, {
                method: isLiked ? 'DELETE' : 'POST',
            });

            if (response.ok) {
                const newLiked = !isLiked;
                const newCount = isLiked ? likeCount - 1 : likeCount + 1;

                setIsLiked(newLiked);
                setLikeCount(newCount);
                onLikeChange?.(newLiked, newCount);
            } else {
                const errorData = await response.json();
                console.error('Error toggling like:', errorData.error);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleLike}
            disabled={!isAuthenticated || isLoading}
            className={`flex items-center gap-1 ${textSizeClasses[size]} transition-all duration-200 ${isLiked
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : 'hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-105'
                } ${isLoading ? 'opacity-50' : ''} rounded-full p-1 active:scale-95`}
            title={isAuthenticated ? (isLiked ? 'Unlike' : 'Like') : 'Sign in to like'}
        >
            <svg
                className={`${sizeClasses[size]} transition-all duration-200 ${isLiked ? 'animate-pulse' : ''}`}
                fill={isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
            {showCount && (
                <span className={`transition-all duration-200 ${isLiked ? 'font-semibold' : ''}`}>
                    {likeCount}
                </span>
            )}
        </button>
    );
}