"use client"

import { cn } from "@/lib/utils/utils"
import React from "react"

interface LoaderProps {
  variant?:
    | "circular"
    | "classic"
    | "pulse"
    | "pulse-dot"
    | "dots"
    | "typing"
    | "wave"
    | "bars"
    | "terminal"
    | "text-blink"
    | "text-shimmer"
    | "loading-dots"
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
}

const CircularLoader = ({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className={cn("animate-spin text-primary", sizeClasses[size], className)}>
      <svg
        className="h-full w-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="32"
          strokeDashoffset="32"
          className="opacity-30"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="32"
          strokeDashoffset="24"
          className=""
        />
      </svg>
    </div>
  )
}

const ClassicLoader = ({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className={cn("relative inline-block", sizeClasses[size], className)}>
      {[...Array(12)].map((_, i) => {
        const barClass = size === "sm" 
          ? "w-0.5 h-3" 
          : size === "lg" 
            ? "w-1.5 h-5" 
            : "w-1 h-4";
        return (
          <div
            key={i}
            className={cn(
              "absolute top-0 left-1/2 bg-primary rounded-full",
              barClass,
              `classic-spinner-bar-${i}`
            )}
          />
        );
      })}
    </div>
  )
}

const PulseLoader = ({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div
      className={cn(
        "bg-primary rounded-full animate-pulse",
        sizeClasses[size],
        className
      )}
    />
  )
}

const PulseDotLoader = ({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) => {
  const containerSizes: Record<string, string> = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className={cn("relative", containerSizes[size], className)}>
      <div className="absolute inset-0 bg-primary/75 rounded-full animate-ping" />
      <div className="relative bg-primary rounded-full h-full w-full" />
    </div>
  )
}

const DotsLoader = ({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) => {
  const containerSizes: Record<string, string> = {
    sm: "h-4",
    md: "h-6",
    lg: "h-8",
  }

  const dotSizes: Record<string, string> = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5",
    lg: "h-2 w-2",
  }

  const delayClasses = [
    "animate-[bounce-dots_1.4s_ease-in-out_infinite]",
    "animate-[bounce-dots_1.4s_ease-in-out_0.16s_infinite]",
    "animate-[bounce-dots_1.4s_ease-in-out_0.32s_infinite]"
  ]

  return (
    <div
      className={cn("flex items-center gap-1", containerSizes[size], className)}
      role="status"
    >
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-primary rounded-full",
            dotSizes[size],
            delayClasses[i]
          )}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}

const TypingLoader = ({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) => {
  const containerSizes: Record<string, string> = {
    sm: "h-4",
    md: "h-6",
    lg: "h-8",
  }

  const dotSizes: Record<string, string> = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5",
    lg: "h-2 w-2",
  }

  const delayClasses = [
    "animate-[typing_1s_ease-in-out_infinite]",
    "animate-[typing_1s_ease-in-out_0.25s_infinite]",
    "animate-[typing_1s_ease-in-out_0.5s_infinite]"
  ]

  return (
    <div
      className={cn("flex items-center gap-1", containerSizes[size], className)}
      role="status"
    >
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-primary rounded-full",
            dotSizes[size],
            delayClasses[i]
          )}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}

const WaveLoader = ({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) => {
  const containerSizes: Record<string, string> = {
    sm: "h-4",
    md: "h-6",
    lg: "h-8",
  }

  const barSizes: Record<string, string> = {
    sm: "w-0.5",
    md: "w-1",
    lg: "w-1.5",
  }

  const delayClasses = [
    "animate-[wave_1.2s_ease-in-out_infinite]",
    "animate-[wave_1.2s_ease-in-out_0.1s_infinite]",
    "animate-[wave_1.2s_ease-in-out_0.2s_infinite]",
    "animate-[wave_1.2s_ease-in-out_0.3s_infinite]",
    "animate-[wave_1.2s_ease-in-out_0.4s_infinite]"
  ]

  return (
    <div
      className={cn("flex items-end gap-1", containerSizes[size], className)}
      role="status"
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-primary origin-bottom h-full animation-ease-in-out",
            barSizes[size],
            delayClasses[i]
          )}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}

const BarsLoader = ({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) => {
  const containerSizes: Record<string, string> = {
    sm: "h-4",
    md: "h-6",
    lg: "h-8",
  }

  const barSizes: Record<string, string> = {
    sm: "w-0.5",
    md: "w-1",
    lg: "w-1.5",
  }

  const delayClasses = [
    "animate-[bars_1.2s_ease-in-out_infinite]",
    "animate-[bars_1.2s_ease-in-out_0.15s_infinite]",
    "animate-[bars_1.2s_ease-in-out_0.3s_infinite]",
    "animate-[bars_1.2s_ease-in-out_0.45s_infinite]"
  ]

  return (
    <div
      className={cn("flex items-end gap-0.5", containerSizes[size], className)}
      role="status"
    >
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-primary origin-bottom rounded-sm animation-ease-in-out",
            barSizes[size],
            delayClasses[i]
          )}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}

const TerminalLoader = ({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) => {
  const cursorSizes: Record<string, string> = {
    sm: "h-3 w-1.5",
    md: "h-4 w-2",
    lg: "h-5 w-2.5",
  }

  const textSizes: Record<string, string> = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="status"
    >
      <span className={cn(
        "text-primary font-mono",
        textSizes[size]
      )}>
        {'>'}
      </span>
      <div
        className={cn(
          "bg-primary animate-[blink_1s_step-end_infinite]",
          cursorSizes[size]
        )}
      />
      <span className="sr-only">Loading</span>
    </div>
  )
}

const TextBlinkLoader = ({
  text = "Thinking",
  className,
  size = "md",
}: {
  text?: string
  className?: string
  size?: "sm" | "md" | "lg"
}) => {
  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div
      className={cn(
        "animate-[text-blink_2s_ease-in-out_infinite] font-medium",
        textSizes[size],
        className
      )}
      role="status"
    >
      {text}
    </div>
  )
}

const TextShimmerLoader = ({
  text = "Thinking",
  className,
  size = "md",
}: {
  text?: string
  className?: string
  size?: "sm" | "md" | "lg"
}) => {
  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-muted-foreground/40 via-foreground to-muted-foreground/40 bg-[length:200%_auto] bg-clip-text font-medium text-transparent",
        "animate-[shimmer_4s_linear_infinite]",
        textSizes[size],
        className
      )}
      role="status"
    >
      {text}
    </div>
  )
}

const TextDotsLoader = ({
  className,
  text = "Thinking",
  size = "md",
}: {
  className?: string
  text?: string
  size?: "sm" | "md" | "lg"
}) => {
  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div
      className={cn("inline-flex items-center", className)}
      role="status"
    >
      <span className={cn("text-primary font-medium", textSizes[size])}>
        {text}
      </span>
      <span className="inline-flex ml-1">
        <span className="text-primary animate-[loading-dots_1.4s_infinite] [animation-delay:0.2s]">.</span>
        <span className="text-primary animate-[loading-dots_1.4s_infinite] [animation-delay:0.4s]">.</span>
        <span className="text-primary animate-[loading-dots_1.4s_infinite] [animation-delay:0.6s]">.</span>
      </span>
    </div>
  )
}

const Loader = ({
  variant = "circular",
  size = "md",
  text,
  className,
}: LoaderProps) => {
  switch (variant) {
    case "circular":
      return <CircularLoader size={size} className={className} />
    case "classic":
      return <ClassicLoader size={size} className={className} />
    case "pulse":
      return <PulseLoader size={size} className={className} />
    case "pulse-dot":
      return <PulseDotLoader size={size} className={className} />
    case "dots":
      return <DotsLoader size={size} className={className} />
    case "typing":
      return <TypingLoader size={size} className={className} />
    case "wave":
      return <WaveLoader size={size} className={className} />
    case "bars":
      return <BarsLoader size={size} className={className} />
    case "terminal":
      return <TerminalLoader size={size} className={className} />
    case "text-blink":
      return (
        <TextBlinkLoader text={text} size={size} className={className} />
      )
    case "text-shimmer":
      return (
        <TextShimmerLoader text={text} size={size} className={className} />
      )
    case "loading-dots":
      return (
        <TextDotsLoader text={text} size={size} className={className} />
      )
    default:
      return <CircularLoader size={size} className={className} />
  }
}

export {
  Loader,
  CircularLoader,
  ClassicLoader,
  PulseLoader,
  PulseDotLoader,
  DotsLoader,
  TypingLoader,
  WaveLoader,
  BarsLoader,
  TerminalLoader,
  TextBlinkLoader,
  TextShimmerLoader,
  TextDotsLoader,
}
