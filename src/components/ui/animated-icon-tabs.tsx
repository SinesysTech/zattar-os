"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { ClientOnlyTabs } from "@/components/ui/client-only-tabs"
import { cn } from "@/lib/utils"

export type AnimatedIconTabItem = {
  value: string
  label: string
  icon: React.ReactNode
  content?: React.ReactNode
  disabled?: boolean
}

export type AnimatedIconTabsProps = Omit<
  React.ComponentProps<typeof ClientOnlyTabs>,
  "children" | "defaultValue" | "value" | "onValueChange"
> & {
  tabs: AnimatedIconTabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  listClassName?: string
  triggerClassName?: string
  activeTriggerClassName?: string
  inactiveTriggerClassName?: string
  contentClassName?: string
}

export function AnimatedIconTabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
  listClassName,
  triggerClassName,
  activeTriggerClassName,
  inactiveTriggerClassName,
  contentClassName,
  ...props
}: AnimatedIconTabsProps) {
  const firstTab = tabs[0]?.value
  const initialValue = defaultValue ?? firstTab

  const [internalValue, setInternalValue] = React.useState<string | undefined>(initialValue)
  const currentValue = value ?? internalValue

  React.useEffect(() => {
    if (value !== undefined) return

    const nextInitial = defaultValue ?? tabs[0]?.value
    if (!nextInitial) return

    const hasCurrent = currentValue && tabs.some((t) => t.value === currentValue)
    if (!hasCurrent) setInternalValue(nextInitial)
  }, [value, defaultValue, tabs, currentValue])

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) setInternalValue(nextValue)
      onValueChange?.(nextValue)
    },
    [value, onValueChange]
  )

  return (
    <ClientOnlyTabs
      {...(value !== undefined ? { value } : {})}
      {...(value === undefined ? { defaultValue: initialValue } : {})}
      onValueChange={handleValueChange}
      className={cn("w-fit self-start", className)}
      {...props}
    >
      <TabsPrimitive.List
        className={cn(
          "inline-flex h-auto w-fit items-center justify-start gap-2 rounded-xl border border-border bg-white p-1 shadow-sm",
          "dark:bg-gray-950",
          listClassName
        )}
      >
        {tabs.map((tab) => {
          return (
            <TabsPrimitive.Trigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className={cn(
                "relative inline-flex flex-none items-center justify-start py-2 text-sm font-medium transition-colors duration-300",
                "rounded-lg gap-0 px-2",
                "data-[state=active]:gap-2 data-[state=active]:px-4",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
                "data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:bg-transparent",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-50",
                "overflow-hidden",
                "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
                "[&_.animated-icon-tabs__label]:max-w-0 [&_.animated-icon-tabs__label]:opacity-0 [&_.animated-icon-tabs__label]:ml-0",
                "data-[state=active]:[&_.animated-icon-tabs__label]:max-w-[320px]",
                "data-[state=active]:[&_.animated-icon-tabs__label]:opacity-100",
                "data-[state=active]:[&_.animated-icon-tabs__label]:ml-2",
                "[&_.animated-icon-tabs__bg]:opacity-0",
                "data-[state=active]:[&_.animated-icon-tabs__bg]:opacity-100",
                triggerClassName,
                "data-[state=active]:" + (activeTriggerClassName ?? ""),
                "data-[state=inactive]:" + (inactiveTriggerClassName ?? "")
              )}
            >
              <span className="relative z-10 inline-flex items-center">{tab.icon}</span>

              <span
                className={cn(
                  "animated-icon-tabs__label relative z-10 inline-block overflow-hidden whitespace-nowrap",
                  "transition-[max-width,opacity,margin-left] duration-300 ease-in-out"
                )}
              >
                {tab.label}
              </span>

              <span
                aria-hidden
                className={cn(
                  "animated-icon-tabs__bg absolute inset-0 rounded-lg bg-primary",
                  "transition-opacity duration-200"
                )}
              />
            </TabsPrimitive.Trigger>
          )
        })}
      </TabsPrimitive.List>

      {tabs.some((t) => t.content != null) &&
        tabs.map((tab) => (
          <TabsPrimitive.Content
            key={tab.value}
            value={tab.value}
            className={cn("mt-2 outline-none", contentClassName)}
          >
            {tab.content}
          </TabsPrimitive.Content>
        ))}
    </ClientOnlyTabs>
  )
}
