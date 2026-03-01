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
  primary:
    'bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110',
  secondary:
    'bg-surface-light/80 text-text hover:bg-surface-light',
  outline:
    'bg-transparent border border-white/10 text-text hover:bg-white/5',
  danger:
    'bg-gradient-to-r from-danger to-rose-600 text-white shadow-lg shadow-danger/25 hover:shadow-danger/40 hover:brightness-110',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-4 py-2 text-sm',
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
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        w-full inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-200
        cursor-pointer active:scale-[0.98]
        disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {title}
    </button>
  );
}
