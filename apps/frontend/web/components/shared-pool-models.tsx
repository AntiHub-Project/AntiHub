'use client';

import { useEffect, useState } from 'react';
import { getSharedPoolStats, type SharedPoolStats, type SharedPoolModelStats } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Gemini, Claude, OpenAI } from '@lobehub/icons';
import { IconCpu } from '@tabler/icons-react';

interface ModelData {
  name: string;
  stats: SharedPoolModelStats;
}

// 模型显示顺序（按用户指定的顺序）
const MODEL_ORDER: string[] = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash-thinking',
    'gemini-2.5-flash-image',
    'gemini-2.5-pro',
    'gemini-3-pro-low',
    'gemini-3-pro-high',
    'gemini-3-pro-image',
    'chat_20706',
    'chat_23310',
    'rev19-uic3-1p',
    'gpt-oss-120b-medium',
    'claude-sonnet-4-5',
    'claude-sonnet-4-5-thinking',
    'claude-opus-4-5-thinking',
];

export function SharedPoolModels() {
  const [models, setModels] = useState<ModelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const data = await getSharedPoolStats();
        // 转换为数组并按指定顺序排序
        const modelArray = Object.entries(data.quotas_by_model).map(([name, stats]) => ({
          name,
          stats
        }));
        // 按指定顺序排序
        const sorted = modelArray.sort((a, b) => {
          const indexA = MODEL_ORDER.indexOf(a.name);
          const indexB = MODEL_ORDER.indexOf(b.name);
          // 如果模型不在列表中，放到最后
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
        setModels(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载模型数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  const getModelDisplayName = (model: string) => {
    const modelNames: Record<string, string> = {
      'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
      'claude-sonnet-4-5-thinking': 'Claude Sonnet 4.5 (Thinking)',
      'claude-opus-4-5-thinking': 'Claude Opus 4.5 (Thinking)',
      'gemini-2.5-flash-image': 'Gemini 2.5 Flash Image',
      'gemini-2.5-flash-thinking': 'Gemini 2.5 Flash (Thinking)',
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gpt-oss-120b-medium': 'GPT OSS 120B (Medium)',
      'gemini-3-pro-image': 'Gemini 3 Pro Image',
      'gemini-3-pro-high': 'Gemini 3 Pro (High)',
      'gemini-3-pro-low': 'Gemini 3 Pro (Low)',
      'claude-sonnet-4-5': 'Claude Sonnet 4.5',
      'rev19-uic3-1p': 'Rev19 UIC3 1P',
      'gemini-2.5-pro': 'Gemini 2.5 Pro',
      'chat_20706': 'Chat 20706',
      'chat_23310': 'Chat 23310',
    };
    return modelNames[model] || model;
  };

  const formatQuota = (quota: number) => {
    return quota.toFixed(4);
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

  const formatResetTime = (time: string | null) => {
    if (!time) return '无限制';
    const date = new Date(time);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diff < 0) return '已过期';
    if (hours > 24) return `${Math.floor(hours / 24)}天后`;
    if (hours > 0) return `${hours}小时${minutes}分钟后`;
    return `${minutes}分钟后`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCpu className="size-5" />
            共享池模型配额
          </CardTitle>
          <CardDescription>各模型的配额使用情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          模型配额
        </CardTitle>
        <CardDescription>
          Antigravity 共享池中有 {models.length} 个模型可用
        </CardDescription>
      </CardHeader>
      <CardContent>
        {models.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">暂无模型数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">模型名称</TableHead>
                  <TableHead className="min-w-[100px]">剩余配额</TableHead>
                  <TableHead className="min-w-[100px]">可用账号</TableHead>
                  <TableHead className="min-w-[80px]">状态</TableHead>
                  <TableHead className="min-w-[120px]">配额重置</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => {
                  const isAvailable = model.stats.total_quota > 0 && model.stats.status === 1;

                  return (
                    <TableRow key={model.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getModelIcon(model.name)}
                          <span className="whitespace-nowrap">{getModelDisplayName(model.name)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {formatQuota(model.stats.total_quota)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {model.stats.available_cookies} 个
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isAvailable ? 'default' : 'secondary'} className="whitespace-nowrap">
                          {isAvailable ? '可用' : '不可用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatResetTime(model.stats.earliest_reset_time)}
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
  );
}