'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  count: number;
  icon: React.ReactElement;
  href: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  count,
  icon,
  href,
}) => {
  return (
    <Link href={href}>
      <Card className="group hover:border-primary/50 transition-colors h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
            <div className="text-primary">
              {icon}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{count}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {count === 1 ? 'registro' : 'registros'} encontrado{count !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};
