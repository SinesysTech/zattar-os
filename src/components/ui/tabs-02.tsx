import * as React from "react"
import { TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ClientOnlyTabs } from "@/components/ui/client-only-tabs"
import { cn } from "@/lib/utils"

export function Tabs02({ className, ...props }: React.ComponentProps<typeof ClientOnlyTabs>) {
  return <ClientOnlyTabs className={cn(className)} {...props} />
}

export function TabsList02({ className, ...props }: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn(
        "h-auto w-fit bg-white dark:bg-muted/50 justify-start gap-1 border border-border dark:border-border/50 p-1",
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
        "flex-none text-muted-foreground dark:text-foreground/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export { TabsContent as TabsContent02 }
