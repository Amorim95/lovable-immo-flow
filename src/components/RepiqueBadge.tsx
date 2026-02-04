import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

interface RepiqueBadgeProps {
  count: number;
  className?: string;
}

export function RepiqueBadge({ count, className }: RepiqueBadgeProps) {
  if (!count || count <= 0) return null;

  return (
    <Badge 
      variant="outline" 
      className={`bg-amber-50 text-amber-700 border-amber-200 text-xs ${className}`}
      title={`Este lead foi redistribuído ${count} vez(es) automaticamente`}
    >
      <RefreshCw className="w-3 h-3 mr-1" />
      Repique {count}x
    </Badge>
  );
}
