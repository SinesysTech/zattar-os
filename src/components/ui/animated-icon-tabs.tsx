"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { ClientOnlyTabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/client-only-tabs"
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
      className={cn("w-fit", className)}
      {...props}
    >
      <TabsList
        className={cn(
          "bg-transparent p-0 inline-flex h-auto w-fit items-center justify-start gap-2",
          listClassName
        )}
      >
        {tabs.map((tab) => {
          const isActive = currentValue === tab.value

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className={cn(
                "relative inline-flex items-center py-2 text-sm font-medium transition-colors duration-300",
                isActive ? "gap-2 rounded-lg px-4" : "gap-0 rounded-none px-2",
                "text-muted-foreground hover:bg-muted hover:text-foreground",
                "data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:bg-transparent",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-50",
                "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
                triggerClassName,
                isActive ? activeTriggerClassName : inactiveTriggerClassName
              )}
            >
              <span className="relative z-10 inline-flex items-center">{tab.icon}</span>

              <motion.span
                className="relative z-10 overflow-hidden"
                initial={false}
                animate={{
                  width: isActive ? "auto" : 0,
                  opacity: isActive ? 1 : 0,
                  marginLeft: isActive ? 8 : 0,
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {tab.label}
              </motion.span>

              <motion.div
                aria-hidden
                className={cn("absolute inset-0 rounded-lg bg-primary")}
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              />
            </TabsTrigger>
          )
        })}
      </TabsList>

      {tabs.some((t) => t.content != null) &&
        tabs.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className={cn("mt-2 outline-none", contentClassName)}
          >
            {tab.content}
          </TabsContent>
        ))}
    </ClientOnlyTabs>
  )
}
