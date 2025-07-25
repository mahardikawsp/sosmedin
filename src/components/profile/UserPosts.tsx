'use client';

import { PostList } from '@/components/posts';

interface UserPostsProps {
  username: string;
}

export default function UserPosts({ username }: UserPostsProps) {
  return <PostList type="user" username={username} />;
}
