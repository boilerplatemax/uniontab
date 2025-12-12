'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { GrievanceStatusBadge } from './grievance-status-badge';
import { GrievancePriorityBadge } from './grievance-priority-badge';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Paperclip, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GrievanceCardProps {
  grievance: any;
  unionSlug: string;
  isAdmin?: boolean;
}

export function GrievanceCard({ grievance, unionSlug, isAdmin = false }: GrievanceCardProps) {
  const commentCount = grievance.comments?.length || 0;
  const attachmentCount = grievance.attachments?.length || 0;

  return (
    <Link href={`/${unionSlug}/grievances/${grievance.id}`}>
      <Card className="hover:border-primary/50 transition-all cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-2 line-clamp-1">
                {grievance.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {grievance.description}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-end shrink-0">
              <GrievanceStatusBadge status={grievance.status} />
              {grievance.priority && (
                <GrievancePriorityBadge priority={grievance.priority} />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {grievance.category && (
              <Badge variant="outline" className="bg-gray-50">
                {grievance.category}
              </Badge>
            )}
            {isAdmin && grievance.member?.user && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                <User className="h-3 w-3" />
                {grievance.member.user.name}
              </Badge>
            )}
            {grievance.assignedTo && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1">
                <User className="h-3 w-3" />
                Assigned to {grievance.assignedTo.name}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              {commentCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{commentCount}</span>
                </div>
              )}
              {attachmentCount > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-4 w-4" />
                  <span>{attachmentCount}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDistanceToNow(new Date(grievance.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
