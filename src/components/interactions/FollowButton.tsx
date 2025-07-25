'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/use-session';

interface FollowButtonProps {
    username: string;
    initialFollowing: boolean;
    onFollowChange?: (following: boolean) => void;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'outline';
}

export default function FollowButton({
    username,
    initialFollowing,
    onFollowChange,
    size = 'md',
    variant = 'default'
}: FollowButtonProps) {
    const { data: session, isAuthenticated } = useSession();
    const [isFollowing, setIsFollowing] = useState(initialFollowing);
    const [isLoading, setIsLoading] = useState(false);

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const getButtonClasses = () => {
        const baseClasses = `${sizeClasses[size]} font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`;

        if (variant === 'outline') {
            return `${baseClasses} border ${isFollowing
                ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                : 'border-blue-600 text-blue-600 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`;
        }

        return `${baseClasses} ${isFollowing
            ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
            : 'bg-blue-600 text-white hover:bg-blue-700'
            }`;
    };

    const handleFollow = async () => {
        if (!isAuthenticated || isLoading) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/users/${username}/follow`, {
                method: isFollowing ? 'DELETE' : 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                setIsFollowing(data.isFollowing);
                onFollowChange?.(data.isFollowing);
            } else {
                const errorData = await response.json();
                console.error('Error toggling follow:', errorData.error);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={handleFollow}
            disabled={isLoading}
            className={`${getButtonClasses()} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
        </button>
    );
}