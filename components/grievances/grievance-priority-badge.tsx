import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GrievancePriority } from '@/lib/db/schema';
import { AlertCircle } from 'lucide-react';

interface GrievancePriorityBadgeProps {
  priority: string;
  className?: string;
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  [GrievancePriority.LOW]: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-700 border-gray-300'
  },
  [GrievancePriority.MEDIUM]: {
    label: 'Medium',
    className: 'bg-blue-100 text-blue-700 border-blue-300'
  },
  [GrievancePriority.HIGH]: {
    label: 'High',
    className: 'bg-orange-100 text-orange-700 border-orange-300'
  },
  [GrievancePriority.URGENT]: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-700 border-red-300'
  }
};

export function GrievancePriorityBadge({ priority, className }: GrievancePriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig[GrievancePriority.MEDIUM];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, 'gap-1', className)}
    >
      {(priority === GrievancePriority.HIGH || priority === GrievancePriority.URGENT) && (
        <AlertCircle className="h-3 w-3" />
      )}
      {config.label}
    </Badge>
  );
}
