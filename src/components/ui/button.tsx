import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Slot } from 'radix-ui';

// Shared by the React <Button> and the static Astro components (src/components/site/Button.astro).
// Focus styling comes from the global :focus-visible outline (src/styles/global.css), so no ring classes here.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent font-medium whitespace-nowrap no-underline transition-colors select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/85',
        // WhatsApp CTAs only: brand green with a black label (10.6:1).
        whatsapp:
          'bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp-hover',
        outline: 'border-ink bg-transparent text-ink hover:bg-muted',
        ghost: 'text-ink hover:bg-muted',
        destructive: 'bg-destructive text-background hover:bg-destructive/85',
        link: 'h-auto px-0 text-ink underline decoration-1 underline-offset-[0.2em] hover:decoration-2',
      },
      size: {
        // 40px: secondary header controls.
        sm: 'h-10 px-3 text-sm',
        // 44px: primary CTAs (NFR-A3).
        default: 'h-11 px-4 text-sm',
        // 52px: hero and closing CTAs.
        lg: "h-13 gap-2.5 px-5 text-base [&_svg:not([class*='size-'])]:size-5",
        icon: 'size-10',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type ButtonVariants = VariantProps<typeof buttonVariants>;
