import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, Clock, AlertCircle, Loader2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'confirmed' | 'pending' | 'processing' | 'failed' | 'active' | 'expired' | 'overdue';
  className?: string;
}

const statusConfig = {
  confirmed: {
    label: 'Confirmed',
    icon: Check,
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-info/10 text-info border-info/20 hover:bg-info/20',
    iconClass: 'animate-spin',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
  },
  active: {
    label: 'Active',
    icon: Check,
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
  },
  expired: {
    label: 'Expired',
    icon: AlertCircle,
    className: 'bg-muted text-muted-foreground border-border hover:bg-muted',
  },
  overdue: {
    label: 'Overdue',
    icon: AlertCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium transition-colors',
        config.className,
        className
      )}
    >
      <Icon className={cn('h-3 w-3', 'iconClass' in config && config.iconClass)} />
      {config.label}
    </Badge>
  );
}
