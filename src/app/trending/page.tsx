'use client';

import Feed from '@/components/feed/Feed';

export default function TrendingPage() {
    return <Feed type="trending" showPostForm={false} />;
}