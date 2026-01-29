"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { getQuotaConsumption, type QuotaConsumption } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const chartConfig = {
  quota_consumed: {
    label: "配额消耗",
    color: "hsl(var(--chart-1))",
  },
  count: {
    label: "调用次数",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface TrendDataPoint {
  time: string;
  quota_consumed: number;
  count: number;
}

export function QuotaTrendChart() {
  const [timeRange, setTimeRange] = React.useState("24")
  const [data, setData] = React.useState<TrendDataPoint[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const hours = parseInt(timeRange)
        const now = new Date()
        const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)
        
        // 获取消耗记录
        const consumptionData = await getQuotaConsumption({
          limit: 1000,
          start_date: startTime.toISOString(),
          end_date: now.toISOString()
        })

        // 按小时聚合数据
        const hourlyData = new Map<string, { quota: number; count: number }>()
        
        consumptionData.forEach(record => {
          const date = new Date(record.consumed_at)
          const hourKey = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString()
          
          const existing = hourlyData.get(hourKey) || { quota: 0, count: 0 }
          existing.quota += parseFloat(record.quota_consumed)
          existing.count += 1
          hourlyData.set(hourKey, existing)
        })

        // 转换为图表数据
        const chartData: TrendDataPoint[] = []
        for (let i = 0; i < hours; i++) {
          const time = new Date(now.getTime() - (hours - i) * 60 * 60 * 1000)
          const hourKey = new Date(time.getFullYear(), time.getMonth(), time.getDate(), time.getHours()).toISOString()
          const data = hourlyData.get(hourKey) || { quota: 0, count: 0 }
          
          chartData.push({
            time: hourKey,
            quota_consumed: data.quota,
            count: data.count
          })
        }

        setData(chartData)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载趋势数据失败')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [timeRange])

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>配额消耗趋势</CardTitle>
          <CardDescription>共享池配额使用情况</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <div className="text-red-500 text-sm">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>配额消耗趋势</CardTitle>
        <CardAction>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-40"
              size="sm"
              aria-label="选择时间范围"
            >
              <SelectValue placeholder="过去24小时" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="24" className="rounded-lg">
                过去24小时
              </SelectItem>
              <SelectItem value="48" className="rounded-lg">
                过去48小时
              </SelectItem>
              <SelectItem value="168" className="rounded-lg">
                过去7天
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillQuota" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-quota_consumed)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-quota_consumed)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-count)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleString("zh-CN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleString("zh-CN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="quota_consumed"
              type="monotone"
              fill="url(#fillQuota)"
              stroke="var(--color-quota_consumed)"
              strokeWidth={2}
            />
            <Area
              dataKey="count"
              type="monotone"
              fill="url(#fillCount)"
              stroke="var(--color-count)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}