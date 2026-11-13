import React from 'react';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export type ButtonVariant =
  | 'default'
  | 'hero'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  hero: 'border border-white/25 bg-black/50 backdrop-blur-md text-foreground hover:border-primary/60 hover:text-primary hover:bg-black/70',
  default:
    'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-[0_8px_24px_rgba(188,239,18,0.28)]',
  destructive: 'bg-red-700 text-white shadow-sm hover:bg-red-800',
  outline:
    'border border-white/15 bg-card/80 text-foreground shadow-sm hover:border-primary/50 hover:text-primary hover:bg-card',
  secondary: 'bg-secondary text-foreground shadow-sm hover:bg-muted',
  ghost: 'text-foreground hover:bg-white/10 hover:text-primary',
  link: 'text-primary underline-offset-4 hover:underline',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: 'h-10 px-5 py-2',
  sm: 'h-8 rounded-lg px-3 text-xs',
  lg: 'h-11 rounded-xl px-7',
  icon: 'h-9 w-9 rounded-lg',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const classes = cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        ...props,
        className: cn(classes, child.props.className),
      } as Partial<{ className?: string }>);
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
