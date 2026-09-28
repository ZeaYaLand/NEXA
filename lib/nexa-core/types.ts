export type UserId = string;
export type PostId = string;
export type CommunityId = string;

export type Visibility = 'public' | 'followers' | 'private';

export interface NEXAUser {
  id: UserId;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface NEXAPost {
  id: PostId;
  authorId: UserId;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string | null;
}

export interface NEXAReactionSummary {
  postId: PostId;
  reaction: string;
  count: number;
}

export interface NEXAFeedCursor {
  createdAt: string;
  id: PostId;
}

export interface NEXAFeedPage {
  items: NEXAPost[];
  nextCursor: NEXAFeedCursor | null;
}

export interface NEXAFollow {
  followerId: UserId;
  followingId: UserId;
  createdAt: string;
}

export interface NEXACommunity {
  id: CommunityId;
  name: string;
  slug: string;
  description: string | null;
  ownerId: UserId;
  createdAt: string;
}
