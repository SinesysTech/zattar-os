import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export function Tabs02Responsive({ className, ...props }: React.ComponentProps<typeof Tabs>) {
  return <Tabs className={cn(className)} {...props} />
}

export function TabsList02Responsive({ className, ...props }: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn(
        "bg-background w-fit justify-start gap-1 border p-1 flex-wrap",
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger02Responsive({ className, ...props }: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
}

export { TabsContent as TabsContent02Responsive }
