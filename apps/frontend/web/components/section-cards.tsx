'use client';

import { useEffect, useState } from "react"
import { IconUsers, IconCpu, IconChartBar, IconActivity } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getSharedPoolStats, getQuotaConsumption, getSharedPoolQuotas, type SharedPoolStats, type UserConsumption } from "@/lib/api"

interface ComputedStats {
  totalAccounts: number;
  activeAccounts: number;
  totalModels: number;
  availableModels: number;
  consumedLast24h: number;
  callsLast24h: number;
  totalRequests: number;
  totalQuotaConsumed: number;
}

export function SectionCards() {
  const [stats, setStats] = useState<ComputedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // 使用新的统计端点
        const [poolStats, consumptionData, sharedPoolData] = await Promise.all([
          getSharedPoolStats(),
          getQuotaConsumption({ limit: 1000 }),
          getSharedPoolQuotas()
        ]);

        // 计算模型统计
        const models = Object.entries(poolStats.quotas_by_model);
        const totalModels = models.length;
        const availableModels = models.filter(([_, m]) => m.total_quota > 0 && m.status === 1).length;

        // 计算24小时内的消耗
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentConsumption = consumptionData.filter(c => new Date(c.consumed_at) >= last24h);
        
        const consumedLast24h = recentConsumption.reduce((sum, c) => sum + parseFloat(c.quota_consumed), 0);
        const callsLast24h = recentConsumption.length;

        // 获取用户总消费统计
        const userConsumption = sharedPoolData.user_consumption;

        setStats({
          totalAccounts: poolStats.accounts.total_shared,
          activeAccounts: poolStats.accounts.active_shared,
          totalModels,
          availableModels,
          consumedLast24h,
          callsLast24h,
          totalRequests: userConsumption?.total_requests || 0,
          totalQuotaConsumed: userConsumption?.total_quota_consumed || 0
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
          {error}
        </div>
      </div>
    );
  }

  const accountAvailabilityRate = stats && stats.totalAccounts > 0
    ? ((stats.activeAccounts / stats.totalAccounts) * 100).toFixed(1)
    : '0';
  const modelAvailabilityRate = stats && stats.totalModels > 0
    ? ((stats.availableModels / stats.totalModels) * 100).toFixed(1)
    : '0';

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>共享账号总数</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.totalAccounts || 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            共享池账号总数
          </div>
          <div className="text-muted-foreground">
            所有共享账号
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>活跃账号数</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.activeAccounts || 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconCpu className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            活跃率 {accountAvailabilityRate}%
          </div>
          <div className="text-muted-foreground">
            当前活跃的账号
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>24小时配额消耗</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.consumedLast24h.toFixed(2) || '0.00'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconChartBar className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            总消耗: {stats?.totalQuotaConsumed?.toFixed(2) || '0.00'}
          </div>
          <div className="text-muted-foreground">Antigravity 配额消耗</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>24小时调用量</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.callsLast24h?.toLocaleString() || '0'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconActivity className="size-4" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            总调用: {stats?.totalRequests?.toLocaleString() || '0'} 次
          </div>
          <div className="text-muted-foreground">Antigravity API 调用</div>
        </CardFooter>
      </Card>
    </div>
  )
}
