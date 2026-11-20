import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Slot } from 'radix-ui';

// Shared by the React <Button> and the static Astro components (src/components/site/Button.astro).
// Focus styling comes from the global :focus-visible outline (src/styles/global.css), so no ring classes here.
// Interaction (owner review 2026-11-17: morph and turn, no lift, no shadow): hover and keyboard focus morph the pill
// into a soft rounded rectangle (M3 expressive style shape change) and a press squashes it a little (scale 0.97)
// while its corners tighten one more step (M3 Expressive pressed shape).
// Springs (2026-11-18, `transition-morph` in global.css): radius and scale ride the fast spatial spring, so the morph
// and the squash land with a small bounce; colours ease on the effect curve and never overshoot.
// The resting radius is half of each size's height, not 9999px, so the radius interpolates over the visible range
// instead of snapping at the end; pass no `rounded-full` override, or the morph snaps. The focus outline follows the
// shape. Trailing ArrowIcons (data-arrow) turn 45 degrees from the up-right arrow to a right arrow through the global
// rule in global.css (it also covers non-button rows). All of it is motion-safe: with reduced motion the button stays
// a pill and only colours change. No shadows or pseudo-elements, so nothing to switch off in forced colors.
// Tailwind scans these strings, so every class is written out in full (no template-built class names).
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 border border-transparent font-medium whitespace-nowrap no-underline transition-morph select-none motion-safe:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        // WhatsApp CTAs only: emerald with a white label.
        whatsapp:
          'bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp-hover',
        outline: 'border-ink bg-transparent text-ink hover:bg-muted',
        ghost: 'text-ink hover:bg-muted hover:text-link-hover',
        destructive: 'bg-destructive text-background hover:bg-destructive/85',
        link: 'h-auto px-0 text-ink underline decoration-1 underline-offset-[0.2em] hover:decoration-2',
      },
      // Each size: height, resting pill radius (height / 2), the radius it morphs to (about a third of the height) and
      // the tighter radius while pressed.
      size: {
        // 40px: secondary header controls.
        sm: 'h-10 rounded-[1.25rem] px-3 text-sm motion-safe:hover:rounded-md motion-safe:focus-visible:rounded-md motion-safe:active:rounded-sm',
        // 44px: primary CTAs (NFR-A3).
        default:
          'h-11 rounded-[1.375rem] px-4 text-sm motion-safe:hover:rounded-md motion-safe:focus-visible:rounded-md motion-safe:active:rounded-sm',
        // 52px: hero and closing CTAs.
        lg: "h-13 gap-2.5 rounded-[1.625rem] px-5 text-base motion-safe:hover:rounded-lg motion-safe:focus-visible:rounded-lg motion-safe:active:rounded-md [&_svg:not([class*='size-'])]:size-5",
        // Icon buttons: circle -> squircle.
        icon: 'size-10 rounded-[1.25rem] motion-safe:hover:rounded-md motion-safe:focus-visible:rounded-md motion-safe:active:rounded-sm',
        'icon-lg':
          'size-11 rounded-[1.375rem] motion-safe:hover:rounded-md motion-safe:focus-visible:rounded-md motion-safe:active:rounded-sm',
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
