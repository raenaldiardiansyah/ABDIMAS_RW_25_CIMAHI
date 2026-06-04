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
  patternId?: 1 | 2 | 3;
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
  patternId = 1,
}: FeatureCardProps) {
  const isLarge = variant === 'large';

  const renderPattern = (id: 1 | 2 | 3) => {
    switch (id) {
      case 1:
        return (
          <>
            <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-neutral-100/60 transition-transform duration-500 group-hover:scale-110" />
            <div className="pointer-events-none absolute right-10 top-8 h-16 w-16 rounded-full bg-neutral-200/40 transition-transform duration-500 group-hover:scale-105" />
            <div className="pointer-events-none absolute -bottom-4 right-12 h-24 w-24 rounded-full bg-neutral-100/50 transition-transform duration-500 group-hover:scale-110" />
          </>
        );
      case 2:
        return (
          <>
            <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-neutral-100/50 transition-transform duration-500 group-hover:scale-110" />
            <div className="pointer-events-none absolute right-4 -bottom-6 h-32 w-32 rounded-full bg-neutral-200/40 transition-transform duration-500 group-hover:scale-105" />
            <div className="pointer-events-none absolute right-1/2 top-10 h-14 w-14 rounded-full bg-neutral-100/60 transition-transform duration-500 group-hover:scale-110" />
          </>
        );
      case 3:
        return (
          <>
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-neutral-200/30 transition-transform duration-500 group-hover:scale-110" />
            <div className="pointer-events-none absolute right-8 top-4 h-20 w-20 rounded-full bg-neutral-100/60 transition-transform duration-500 group-hover:scale-105" />
            <div className="pointer-events-none absolute left-1/3 -top-6 h-16 w-16 rounded-full bg-neutral-100/40 transition-transform duration-500 group-hover:scale-110" />
          </>
        );
    }
  };

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
        'group relative cursor-pointer overflow-hidden border-none bg-card text-card-foreground shadow-sm transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isLarge ? 'min-h-49.5 rounded-4xl' : 'min-h-53.5 rounded-[1.75rem]'
      )}
    >
      {renderPattern(patternId)}

      <CardContent
        className={cn(
          'relative z-10 flex h-full flex-col p-5',
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
