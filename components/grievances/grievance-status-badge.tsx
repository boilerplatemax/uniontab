import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GrievanceStatus } from '@/lib/db/schema';

interface GrievanceStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  [GrievanceStatus.DRAFT]: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  [GrievanceStatus.SUBMITTED]: {
    label: 'Submitted',
    className: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  [GrievanceStatus.ASSIGNED]: {
    label: 'Assigned',
    className: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  [GrievanceStatus.UNDER_REVIEW]: {
    label: 'Under Review',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  [GrievanceStatus.AWAITING_RESPONSE]: {
    label: 'Awaiting Response',
    className: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  [GrievanceStatus.RESOLVED]: {
    label: 'Resolved',
    className: 'bg-green-100 text-green-800 border-green-300'
  }
};

export function GrievanceStatusBadge({ status, className }: GrievanceStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig[GrievanceStatus.DRAFT];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
