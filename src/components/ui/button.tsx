import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Slot } from 'radix-ui';

// Shared by the React <Button> and the static Astro components (src/components/site/Button.astro).
// Focus styling comes from the global :focus-visible outline (src/styles/global.css), so no ring classes here.
// Phase 5b: hover and keyboard focus lift the button 1px; `glow` variants add a soft cobalt halo (a pseudo-element
// that only fades in, so no paint of the button itself). WhatsApp lifts without a halo. Off under reduced motion
// (lift) and forced colors (halo).
const lift =
  'hover:-translate-y-px focus-visible:-translate-y-px motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0';
const glow =
  'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:shadow-[0_8px_22px_-6px_rgb(var(--glow-rgb)/calc(var(--glow-alpha)*3.5))] before:transition-opacity before:duration-(--dur-2) hover:before:opacity-100 focus-visible:before:opacity-100 forced-colors:before:hidden';

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent font-medium whitespace-nowrap no-underline transition-[color,background-color,border-color,translate] duration-(--dur-2) ease-(--ease-out) select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: `bg-primary text-primary-foreground hover:bg-primary-hover ${lift} ${glow}`,
        // WhatsApp CTAs only: brand green with a black label (10.6:1).
        whatsapp: `bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp-hover ${lift}`,
        outline: `border-ink bg-transparent text-ink hover:bg-muted ${lift} ${glow}`,
        ghost:
          'text-ink hover:bg-muted hover:text-link-hover [&_svg]:transition-transform [&_svg]:duration-(--dur-2) hover:[&_svg]:-translate-y-px motion-reduce:hover:[&_svg]:translate-y-0',
        destructive: `bg-destructive text-background hover:bg-destructive/85 ${lift}`,
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
