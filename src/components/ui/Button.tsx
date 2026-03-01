import { Loader2 } from 'lucide-react';

interface ButtonProps {
  title: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-text hover:bg-primary/80',
  secondary: 'bg-surface-light text-text hover:bg-surface-light/80',
  outline: 'bg-transparent border border-surface-light text-text hover:bg-surface-light/40',
  danger: 'bg-danger text-text hover:bg-danger/80',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

export default function Button({
  title,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'md',
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-colors duration-150
        cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {title}
    </button>
  );
}
