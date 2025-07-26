'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from '@/hooks/use-session';
import ProfileImageUpload from './ProfileImageUpload';
import UserPosts from './UserPosts';
import FollowButton from '@/components/interactions/FollowButton';
import { ReportButton } from '@/components/moderation/ReportButton';

interface ProfilePageProps {
    username: string;
}

interface UserProfile {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    profileImageUrl: string | null;
    createdAt: string;
    isFollowing?: boolean;
    isCurrentUser?: boolean;
    _count: {
        posts: number;
        followedBy: number;
        following: number;
    };
}

export default function ProfilePage({ username }: ProfilePageProps) {
    const { data: session, isAuthenticated } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/users/${username}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('User not found');
                    }
                    throw new Error('Failed to fetch profile');
                }

                const data = await response.json();
                setProfile(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load profile');
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    const handleFollowChange = (following: boolean) => {
        setProfile(prev => prev ? {
            ...prev,
            isFollowing: following,
            _count: {
                ...prev._count,
                followedBy: prev._count.followedBy + (following ? 1 : -1),
            },
        } : null);
    };

    const handleProfileUpdate = (updatedProfile: UserProfile) => {
        setProfile(updatedProfile);
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error || 'Profile not found'}</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Profile Image */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                        {profile.profileImageUrl ? (
                            <Image
                                src={profile.profileImageUrl}
                                alt={profile.displayName}
                                fill
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                                    {profile.displayName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {profile.displayName}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">@{profile.username}</p>

                        {profile.bio && (
                            <p className="mt-2 text-gray-700 dark:text-gray-300">{profile.bio}</p>
                        )}

                        {/* Stats */}
                        <div className="flex gap-4 mt-3 text-sm">
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {profile._count.posts}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 ml-1">posts</span>
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {profile._count.followedBy}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 ml-1">followers</span>
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {profile._count.following}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 ml-1">following</span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Joined {new Date(profile.createdAt).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {profile.isCurrentUser ? (
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </button>
                        ) : (
                            <>
                                <FollowButton
                                    username={username}
                                    initialFollowing={profile.isFollowing || false}
                                    onFollowChange={handleFollowChange}
                                />
                                {isAuthenticated && (
                                    <ReportButton
                                        type="user"
                                        targetId={profile.id}
                                        targetUsername={profile.username}
                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Profile Edit Form */}
                {isEditing && profile.isCurrentUser && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <ProfileEditForm
                            profile={profile}
                            onUpdate={handleProfileUpdate}
                            onCancel={() => setIsEditing(false)}
                        />
                    </div>
                )}

                {/* Profile Image Upload */}
                {profile.isCurrentUser && !isEditing && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Profile Picture
                        </h3>
                        <ProfileImageUpload
                            onSuccess={(updatedProfile) => setProfile(updatedProfile)}
                        />
                    </div>
                )}
            </div>

            {/* User Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Posts</h2>
                <UserPosts username={username} />
            </div>
        </div>
    );
}

// Profile Edit Form Component
interface ProfileEditFormProps {
    profile: UserProfile;
    onUpdate: (profile: UserProfile) => void;
    onCancel: () => void;
}

function ProfileEditForm({ profile, onUpdate, onCancel }: ProfileEditFormProps) {
    const [formData, setFormData] = useState({
        displayName: profile.displayName,
        bio: profile.bio || '',
        username: profile.username,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/users/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update profile');
            }

            const updatedProfile = await response.json();
            onUpdate(updatedProfile);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
            console.error('Error updating profile:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                </div>
            )}

            <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Display Name
                </label>
                <input
                    type="text"
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    maxLength={50}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.displayName.length}/50 characters
                </p>
            </div>

            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                </label>
                <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    pattern="^[a-zA-Z0-9_]{3,20}$"
                    title="Username must be 3-20 characters and contain only letters, numbers, and underscores"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    3-20 characters, letters, numbers, and underscores only
                </p>
            </div>

            <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bio
                </label>
                <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    maxLength={160}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Tell us about yourself..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.bio.length}/160 characters
                </p>
            </div>

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}