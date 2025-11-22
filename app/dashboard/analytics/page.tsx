'use client';

import { useEffect, useState, useRef } from 'react';
import { getUserQuotas, getQuotaConsumption, type UserQuotaItem, type QuotaConsumption } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MorphingSquare } from '@/components/ui/morphing-square';
import { Gemini, Claude, OpenAI } from '@lobehub/icons';
import Toaster, { ToasterRef } from '@/components/ui/toast';

export default function AnalyticsPage() {
  const toasterRef = useRef<ToasterRef>(null);
  const [quotas, setQuotas] = useState<UserQuotaItem[]>([]);
  const [consumptions, setConsumptions] = useState<QuotaConsumption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quotasData, consumptionsData] = await Promise.all([
        getUserQuotas(),
        getQuotaConsumption({ limit: 50 })
      ]);
      setQuotas(quotasData);
      setConsumptions(consumptionsData);
    } catch (err) {
      toasterRef.current?.show({
        title: '加载失败',
        message: err instanceof Error ? err.message : '加载数据失败',
        variant: 'error',
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getModelDisplayName = (model: string) => {
    const modelNames: Record<string, string> = {
      'gemini-2.5-pro': 'Gemini 2.5 Pro',
      'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
      'claude-sonnet-4-5-thinking': 'Claude Sonnet 4.5 Thinking',
      'gemini-2.5-flash-image': 'Gemini 2.5 Flash Image',
      'gemini-2.5-flash-thinking': 'Gemini 2.5 Flash Thinking',
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gpt-oss-120b-medium': 'GPT OSS 120B Medium',
      'gemini-3-pro-image': 'Gemini 3 Pro Image',
      'gemini-3-pro-high': 'Gemini 3 Pro High',
      'gemini-3-pro-low': 'Gemini 3 Pro Low',
      'claude-sonnet-4-5': 'Claude Sonnet 4.5',
      'chat_20706': 'Chat 20706',
      'chat_23310': 'Chat 23310',
      'rev19-uic3-1p': 'Rev19 UIC3 1P',
    };
    return modelNames[model] || model;
  };

  const formatQuota = (quota: string) => {
    const num = parseFloat(quota);
    return isNaN(num) ? '0.0000' : num.toFixed(4);
  };

  const getModelIcon = (modelName: string) => {
    const lowerName = modelName.toLowerCase();
    if (lowerName.includes('gemini')) {
      return <Gemini.Color className="size-5" />;
    } else if (lowerName.includes('claude')) {
      return <Claude.Color className="size-5" />;
    } else if (lowerName.includes('gpt')) {
      return <OpenAI className="size-5" />;
    } else {
      return <img src="/logo_light.png" alt="" className="size-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-center min-h-screen">
            <MorphingSquare message="加载中..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">

        <Toaster ref={toasterRef} defaultPosition="top-right" />

        {/* 配额列表 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>模型配额</CardTitle>
            <CardDescription>
              您可以使用 {quotas.length} 个模型。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quotas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">暂无配额信息</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">模型名称</TableHead>
                      <TableHead className="min-w-[100px]">当前配额</TableHead>
                      <TableHead className="min-w-[100px]">最大配额</TableHead>
                      <TableHead className="min-w-[80px]">使用率</TableHead>
                      <TableHead className="min-w-[150px]">最后更新</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotas.map((quotaItem) => {
                      const current = parseFloat(quotaItem.quota);
                      const max = parseFloat(quotaItem.max_quota);
                      const usagePercent = max > 0 ? ((max - current) / max * 100).toFixed(1) : '0.0';
                      
                      return (
                        <TableRow key={quotaItem.pool_id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getModelIcon(quotaItem.model_name)}
                              <span className="whitespace-nowrap">{getModelDisplayName(quotaItem.model_name)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm whitespace-nowrap">
                            {formatQuota(quotaItem.quota)}
                          </TableCell>
                          <TableCell className="font-mono text-sm whitespace-nowrap">
                            {formatQuota(quotaItem.max_quota)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={parseFloat(usagePercent) > 50 ? 'destructive' : 'secondary'} className="whitespace-nowrap">
                              {usagePercent}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(quotaItem.last_updated_at).toLocaleString('zh-CN')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 使用记录 */}
        <Card>
          <CardHeader>
            <CardTitle>使用记录</CardTitle>
            <CardDescription>
              共 {consumptions.length} 条使用记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consumptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">暂无使用记录</p>
                <p className="text-sm">立即创建您的 API Key 开始对话吧！</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">账号 ID</TableHead>
                      <TableHead className="min-w-[150px]">模型</TableHead>
                      <TableHead className="min-w-[80px]">类型</TableHead>
                      <TableHead className="min-w-[100px]">消耗配额</TableHead>
                      <TableHead className="min-w-[150px]">时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumptions.map((consumption) => (
                      <TableRow key={consumption.log_id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          <div className="max-w-[150px] truncate" title={consumption.cookie_id || '-'}>
                            {consumption.cookie_id ? consumption.cookie_id : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {getModelDisplayName(consumption.model_name)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={consumption.is_shared === 1 ? 'default' : 'secondary'} className="whitespace-nowrap">
                            {consumption.is_shared === 1 ? '共享' : '专属'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          -{formatQuota(consumption.quota_consumed)}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(consumption.consumed_at).toLocaleString('zh-CN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}