'use client';

import { WidgetDashboard } from '../components/widget-dashboard';

interface DashboardV2ClientProps {
  currentUserId: number;
  currentUserName: string;
}

export function DashboardV2Client({ currentUserId, currentUserName }: DashboardV2ClientProps) {
  return (
    <WidgetDashboard
      currentUserId={currentUserId}
      currentUserName={currentUserName}
    />
  );
}
