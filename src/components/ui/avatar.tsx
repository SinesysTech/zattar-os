"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

const avatarIndicatorVariants = cva(
  "absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-background",
  {
    variants: {
      variant: {
        online: "bg-green-500",
        away: "bg-orange-500",
        offline: "bg-slate-400",
        success: "bg-green-500",
      },
    },
    defaultVariants: {
      variant: "offline",
    },
  }
)

interface AvatarIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarIndicatorVariants> {}

function AvatarIndicator({ className, variant, ...props }: AvatarIndicatorProps) {
  return (
    <div
      className={cn(avatarIndicatorVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarIndicator }