import type { Union, Post, File as FileType, Event, Member, PostAttachment } from '@/lib/db/schema';

export interface ThemeProps {
  union: Union;
  posts: (Omit<Post, 'createdBy'> & {
    createdBy: { name: string };
    likeCount: number;
    isLikedByUser: boolean;
    attachments?: PostAttachment[];
  })[];
  files: (Omit<FileType, 'createdBy'> & { createdBy: { name: string } })[];
  events: (Omit<Event, 'createdBy'> & { createdBy: { name: string } })[];
  membership: any;
  isOwner: boolean;
  isOwnerOrAdmin: boolean;
  isApprovedMember: boolean;
  userId: number | null;
  slug: string;
  accessibilityWidgetEnabled: boolean;
}
