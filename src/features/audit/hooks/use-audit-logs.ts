import { auditLogService } from '@/features/audit/services/audit-log.service';
import useSWR from 'swr';

export function useAuditLogs(entityType: string, entityId: number | undefined) {
  const { data, error, isLoading } = useSWR(
    entityId ? `audit-logs/${entityType}/${entityId}` : null,
    () => auditLogService.getLogs(entityType, entityId!)
  );

  return {
    logs: data,
    isLoading,
    isError: error,
  };
}
