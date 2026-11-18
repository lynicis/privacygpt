import * as React from "react"
import { cva } from "class-variance-authority"
import type { VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[6px] border border-transparent bg-clip-padding font-medium whitespace-nowrap outline-none select-none transition-colors duration-[var(--dur-micro)] ease-[var(--ease-out)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px motion-reduce:active:translate-y-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-destructive aria-invalid:outline-2 aria-invalid:outline-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-signal text-signal-ink hover:bg-[color-mix(in_oklab,var(--color-signal)_88%,var(--color-ink))]",
        outline:
          "border-rule-2 bg-paper-2 text-ink hover:border-ink-2 hover:bg-paper-3",
        secondary: "bg-paper-2 text-ink hover:bg-paper-3",
        ghost: "text-ink-2 hover:bg-paper-2 hover:text-ink",
        destructive:
          "bg-bad-soft text-bad hover:bg-[color-mix(in_oklab,var(--color-bad-soft)_80%,var(--color-bad))]",
        link: "h-auto p-0 text-ink underline decoration-rule-2 underline-offset-4 hover:decoration-signal",
      },
      size: {
        default: "h-10 gap-2 px-4 text-sm",
        xs: "h-8 gap-1.5 px-2.5 text-sm",
        sm: "h-8 gap-1.5 px-3 text-sm",
        lg: "h-12 gap-2 px-5 text-md",
        icon: "size-10",
        "icon-xs": "size-8",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
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
