'use client';

import { ArrowRight, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: LucideIcon;
  judul: string;
  deskripsi: string;
  badge?: string;
  variant?: 'large' | 'compact';
  tone?: 'primary' | 'sky' | 'violet';
  onClick: () => void;
  delay?: number;
}

export default function FeatureCard({
  icon: Icon,
  judul,
  deskripsi,
  badge,
  variant = 'large',
  tone = 'primary',
  onClick,
  delay = 0,
}: FeatureCardProps) {
  const isLarge = variant === 'large';

  const iconToneClass =
    tone === 'sky'
      ? 'bg-secondary/10 text-secondary'
      : tone === 'violet'
        ? 'bg-accent text-accent-foreground'
        : 'bg-primary/10 text-primary';

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        'relative cursor-pointer overflow-hidden border-none bg-card text-card-foreground shadow-sm transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isLarge ? 'min-h-49.5 rounded-4xl' : 'min-h-53.5 rounded-[1.75rem]'
      )}
    >
      <CardContent
        className={cn(
          'flex h-full flex-col p-5',
          isLarge ? 'gap-4' : 'gap-3'
        )}
      >
        <div
          className={cn(
            'flex size-11 items-center justify-center rounded-2xl',
            iconToneClass
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>

        {badge && (
          <Badge
            variant="secondary"
            className="w-fit border-none bg-secondary text-secondary-foreground"
          >
            {badge}
          </Badge>
        )}

        <div className="min-w-0">
          <h3
            className={cn(
              'font-bold tracking-tight text-foreground',
              isLarge ? 'text-base' : 'text-sm'
            )}
          >
            {judul}
          </h3>

          <p
            className={cn(
              'mt-1.5 line-clamp-2 leading-relaxed text-muted-foreground',
              isLarge ? 'text-xs' : 'text-[11px]'
            )}
          >
            {deskripsi}
          </p>
        </div>
      </CardContent>

      <div className="absolute bottom-5 right-5 flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ArrowRight size={isLarge ? 18 : 14} />
      </div>
    </Card>
  );
}