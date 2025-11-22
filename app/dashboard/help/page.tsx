'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconHammer, IconAlertTriangle } from '@tabler/icons-react';

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">

        {/* 施工中卡片 */}
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative bg-primary/10 p-6 rounded-full">
                <IconHammer className="size-16 text-primary" strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">页面施工中</h2>
              <p className="text-muted-foreground max-w-md">
                我们正在努力完善帮助文档，敬请期待！
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
              <IconAlertTriangle className="size-4" />
              <span>如有紧急问题，请联系管理员</span>
            </div>
          </CardContent>
        </Card>

        {/* 临时信息卡片 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">快速开始</CardTitle>
              <CardDescription>即将推出</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                了解如何快速开始使用 AntiHub 平台
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">常见问题</CardTitle>
              <CardDescription>即将推出</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                查看常见问题和解决方案
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API 文档</CardTitle>
              <CardDescription>即将推出</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                详细的 API 使用文档和示例
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}