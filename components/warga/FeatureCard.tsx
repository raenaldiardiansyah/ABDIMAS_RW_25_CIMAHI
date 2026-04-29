'use client';

import { ArrowRight, type LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  judul: string;
  deskripsi: string;
  badge?: string;
  variant?: 'large' | 'compact';
  onClick: () => void;
  delay?: number;
}

export default function FeatureCard({
  icon: Icon,
  judul,
  deskripsi,
  badge,
  variant = 'large',
  onClick,
  delay = 0,
}: FeatureCardProps) {
  const isLarge = variant === 'large';

  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`card ${isLarge ? 'card--big' : 'card--small'}`}
    >
      <div className="card-pattern-layer"></div>
      
      <div className="card-content">
        <div className="card-icon">
          <Icon />
        </div>
        
        {badge && (
          <span className="card-badge">
            {badge}
          </span>
        )}
        
        <h3 className={`card-title ${isLarge ? '' : 'card-title--sm'}`}>
          {judul}
        </h3>
        
        <p className="card-desc">
          {deskripsi}
        </p>
      </div>
      
      <div className="card-arrow">
        <ArrowRight size={isLarge ? 18 : 14} />
      </div>
    </button>
  );
}
