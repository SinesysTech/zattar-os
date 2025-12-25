import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FilterTab, TodoStatus } from "@/features/tasks/types";
import { EnumTodoStatus, todoStatusNamed } from "@/features/tasks/types";

interface StatusTabsProps {
  onTabChange: (tab: FilterTab) => void;
  activeTab: FilterTab;
}

const StatusTabs: React.FC<StatusTabsProps> = ({ onTabChange, activeTab }) => {
  return (
    <Tabs
      defaultValue={activeTab}
      onValueChange={(value) => onTabChange(value as FilterTab)}
      value={activeTab}>
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        {Object.values(EnumTodoStatus).map((status: TodoStatus) => (
          <TabsTrigger key={status} value={status}>
            {todoStatusNamed[status]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default StatusTabs;
