import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/** Interaksi 3D retro game: naik saat hover, turun saat ditekan. */
const gamePress =
  "transition-[transform,box-shadow,filter] duration-150 ease-out hover:scale-[1.03] hover:brightness-105 active:translate-y-[3px] active:scale-[0.995]"

const buttonVariants = cva(
  "group/button cursor-pointer inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: cn(
          gamePress,
          "border-[#c91d24] bg-linear-to-b from-[#f2343a] to-primary text-primary-foreground font-semibold",
          "shadow-[0_1px_0_0_rgba(255,255,255,0.3)_inset,0_2px_0_0_rgba(255,255,255,0.1)_inset,0_5px_0_0_#b8151c,0_8px_16px_-8px_rgba(184,21,28,0.5)]",
          "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.3)_inset,0_2px_0_0_rgba(255,255,255,0.1)_inset,0_6px_0_0_#b8151c,0_12px_20px_-8px_rgba(184,21,28,0.55)]",
          "active:shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_2px_0_0_rgba(255,255,255,0.08)_inset,0_2px_0_0_#b8151c,0_4px_10px_-8px_rgba(184,21,28,0.45)]",
        ),
        outline: cn(
          gamePress,
          "border border-slate-300 bg-linear-to-b from-white to-slate-100 text-slate-800 font-semibold",
          "shadow-[0_1px_0_0_rgba(255,255,255,0.95)_inset,0_2px_0_0_rgba(255,255,255,0.7)_inset,0_4px_0_0_#e2e8f0,0_5px_0_0_#94a3b8,0_8px_14px_-10px_rgba(15,23,42,0.18)]",
          "hover:from-white hover:to-white hover:shadow-[0_1px_0_0_rgba(255,255,255,0.95)_inset,0_2px_0_0_rgba(255,255,255,0.7)_inset,0_5px_0_0_#cbd5e1,0_6px_0_0_#94a3b8,0_11px_18px_-10px_rgba(15,23,42,0.22)]",
          "active:shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_2px_0_0_rgba(255,255,255,0.7)_inset,0_2px_0_0_#cbd5e1,0_3px_0_0_#94a3b8,0_5px_10px_-10px_rgba(15,23,42,0.18)]",
          "aria-expanded:bg-white aria-expanded:text-slate-800 dark:bg-white/95 dark:hover:bg-white",
        ),
        secondary: cn(
          gamePress,
          "border-[color-mix(in_oklch,var(--secondary),var(--foreground)_12%)] bg-linear-to-b from-[color-mix(in_oklch,var(--secondary),white_8%)] to-secondary text-secondary-foreground font-semibold",
          "shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_2px_0_0_rgba(255,255,255,0.08)_inset,0_5px_0_0_color-mix(in_oklch,var(--secondary),var(--foreground)_18%),0_8px_14px_-8px_rgba(15,23,42,0.35)]",
          "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_2px_0_0_rgba(255,255,255,0.08)_inset,0_6px_0_0_color-mix(in_oklch,var(--secondary),var(--foreground)_18%),0_11px_18px_-8px_rgba(15,23,42,0.38)]",
          "active:shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_2px_0_0_color-mix(in_oklch,var(--secondary),var(--foreground)_18%),0_4px_10px_-8px_rgba(15,23,42,0.3)]",
          "aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ),
        ghost:
          "rounded-sm hover:bg-muted hover:text-foreground active:translate-y-px aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "rounded-sm bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "rounded-sm text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
