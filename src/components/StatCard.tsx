import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

const variantStyles = {
  default: 'border-border/50',
  primary: 'border-primary/20',
  success: 'border-success/20',
  warning: 'border-warning/20',
};

const iconBgStyles = {
  default: 'bg-secondary',
  primary: 'bg-primary/10',
  success: 'bg-success/10',
  warning: 'bg-warning/10',
};

const iconColorStyles = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
};

export function StatCard({ title, value, subtitle, icon, variant = 'default' }: StatCardProps) {
  return (
    <Card className={cn('shadow-card hover:shadow-card-hover transition-shadow', variantStyles[variant])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
            <span className="mt-1 text-2xl font-bold tracking-tight">{value}</span>
            {subtitle && <span className="mt-0.5 text-xs text-muted-foreground">{subtitle}</span>}
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconBgStyles[variant])}>
            <div className={iconColorStyles[variant]}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
