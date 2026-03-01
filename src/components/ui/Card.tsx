import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`glass rounded-2xl p-5 mx-4 mb-3 animate-fade-in ${className}`}
    >
      {children}
    </div>
  );
}
