import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export function Tabs02({ className, ...props }: React.ComponentProps<typeof Tabs>) {
  return <Tabs className={cn(className)} {...props} />
}

export function TabsList02({ className, ...props }: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn(
        "bg-background justify-start gap-1 border p-1",
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger02({ className, ...props }: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export { TabsContent as TabsContent02 }
