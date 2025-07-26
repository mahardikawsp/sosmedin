'use client';

import { useParams } from 'next/navigation';
import ProfilePage from '@/components/profile/ProfilePage';

export default function UserProfilePage() {
    const { username } = useParams() as { username: string };

    return <ProfilePage username={username} />;
}