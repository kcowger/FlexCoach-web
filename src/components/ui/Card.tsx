import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-surface rounded-2xl p-4 mx-4 mb-3 ${className}`}>
      {children}
    </div>
  );
}
