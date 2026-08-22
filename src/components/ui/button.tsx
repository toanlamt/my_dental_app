import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Button({ className, variant = 'default', size = 'default', asChild: _asChild, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
  size?: 'default' | 'sm' | 'icon';
  asChild?: boolean;
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        variant === 'outline' && 'border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground',
        variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
        variant === 'danger' && 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        size === 'default' && 'h-10 px-4 py-2 text-sm',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'icon' && 'h-9 w-9',
        className,
      )}
      {...props}
    />
  );
}
