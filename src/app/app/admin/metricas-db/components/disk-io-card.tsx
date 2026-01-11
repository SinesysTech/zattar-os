'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { MetricasDiskIO } from "@/features/admin";

interface DiskIOCardProps {
  diskIO: MetricasDiskIO | null;
}

function getColorClass(percent: number): string {
  if (percent < 80) return "bg-green-500";
  if (percent < 90) return "bg-amber-500";
  return "bg-red-500";
}

function getTextColorClass(percent: number): string {
  if (percent < 80) return "text-green-700";
  if (percent < 90) return "text-amber-700";
  return "text-red-700";
}

export function DiskIOCard({ diskIO }: DiskIOCardProps) {
  const router = useRouter();

  if (!diskIO) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Disk IO Budget</CardTitle>
          <CardDescription>Métricas de Disk IO indisponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <p className="font-medium">⚠️ Management API não configurada</p>
            <p className="mt-1 text-xs">
              Configure SUPABASE_PROJECT_REF e SUPABASE_ACCESS_TOKEN em .env.local
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { disk_io_budget_percent, disk_io_consumption_mbps, disk_io_limit_mbps, disk_iops_consumption, disk_iops_limit, compute_tier } = diskIO;
  const shouldShowUpgradeButton = disk_io_budget_percent >= 80;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Disk IO Budget</CardTitle>
            <CardDescription>Consumo de I/O do banco de dados</CardDescription>
          </div>
          <Badge variant={disk_io_budget_percent >= 90 ? "destructive" : disk_io_budget_percent >= 80 ? "warning" : "success"}>
            {compute_tier}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar principal */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Consumo total</span>
            <span className={`text-sm font-semibold ${getTextColorClass(disk_io_budget_percent)}`}>
              {disk_io_budget_percent.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={disk_io_budget_percent} 
            className="mt-2"
            indicatorClassName={getColorClass(disk_io_budget_percent)}
          />
        </div>

        {/* IOPS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">IOPS</p>
            <p className="mt-1 text-lg font-semibold">
              {disk_iops_consumption.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground"> / {disk_iops_limit.toLocaleString()}</span>
            </p>
          </div>

          {/* Throughput */}
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Throughput</p>
            <p className="mt-1 text-lg font-semibold">
              {disk_io_consumption_mbps.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground"> / {disk_io_limit_mbps.toFixed(1)} MB/s</span>
            </p>
          </div>
        </div>

        {/* Botão de upgrade */}
        {shouldShowUpgradeButton && (
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => router.push('/app/admin/metricas-db/avaliar-upgrade')}
          >
            Ver Opções de Upgrade
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
