import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'outline';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  isLoading?: boolean;
};

export function Button({ variant = 'primary', isLoading, className = '', disabled, children, ...rest }: Props) {
  const base = 'btn';
  const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-outline';
  const glowClass = variant === 'primary' ? 'btn-glow' : '';

  return (
    <button
      className={`${base} ${variantClass} ${glowClass} ${className} ${isLoading ? 'opacity-90' : ''}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? 'Please wait…' : children}
    </button>
  );
}
