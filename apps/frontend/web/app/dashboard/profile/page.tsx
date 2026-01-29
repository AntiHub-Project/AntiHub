'use client';

import { useEffect, useState, useRef } from 'react';
import { getCurrentUser, joinBeta, type UserResponse } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Badge as Badge1 } from '@/components/ui/badge-1';
import { Button as StatefulButton } from '@/components/ui/stateful-button';
import { MorphingSquare } from '@/components/ui/morphing-square';
import { IconUser, IconCalendar, IconShield, IconClock } from '@tabler/icons-react';
import Toaster, { ToasterRef } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const toasterRef = useRef<ToasterRef>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoiningBeta, setIsJoiningBeta] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      toasterRef.current?.show({
        title: '加载失败',
        message: err instanceof Error ? err.message : '加载用户信息失败',
        variant: 'error',
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinBetaClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmJoinBeta = async () => {
    setShowConfirmDialog(false);
    setIsJoiningBeta(true);
    try {
      const result = await joinBeta();
      toasterRef.current?.show({
        title: '加入成功',
        message: result.message,
        variant: 'success',
        position: 'top-right',
      });
      // 刷新用户信息
      await loadUserInfo();
    } catch (err) {
      toasterRef.current?.show({
        title: '加入失败',
        message: err instanceof Error ? err.message : '加入Beta计划失败',
        variant: 'error',
        position: 'top-right',
      });
    } finally {
      setIsJoiningBeta(false);
    }
  };

  // 获取信任等级显示文本
  const getTrustLevelText = (level: number) => {
    const levels: Record<number, string> = {
      0: '新用户',
      1: '基础用户',
      2: '成员',
      3: '正式成员',
      4: '领导者',
    };
    return levels[level] || `等级 ${level}`;
  };

  // 获取信任等级颜色
  const getTrustLevelColor = (level: number): "default" | "secondary" | "destructive" | "outline" => {
    if (level >= 4) return 'default';
    if (level >= 2) return 'secondary';
    return 'outline';
  };

  // 获取用户名首字母
  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || username.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <MorphingSquare message="加载中..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Toaster ref={toasterRef} defaultPosition="top-right" />

        {/* 用户信息卡片 */}
        <Card>
          <CardContent className="space-y-6">
            {/* 头像和基本信息 */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
                <AvatarFallback className="text-2xl">{getInitials(user.username)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">{user.username}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getTrustLevelColor(user.trust_level)}>
                    {getTrustLevelText(user.trust_level)}
                  </Badge>
                  {user.is_active ? (
                    <Badge variant="default">活跃</Badge>
                  ) : (
                    <Badge variant="secondary">未激活</Badge>
                  )}
                  {user.is_silenced && (
                    <Badge variant="destructive">禁言中</Badge>
                  )}
                  {user.beta === 1 && (
                    <Badge1 variant="turbo">
                      Beta
                    </Badge1>
                  )}
                </div>
              </div>
            </div>

            {/* 详细信息 */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-3 text-sm">
                <IconUser className="size-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">用户 ID</div>
                  <div className="text-muted-foreground">{user.id}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <IconShield className="size-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">信任等级</div>
                  <div className="text-muted-foreground">
                    等级 {user.trust_level} - {getTrustLevelText(user.trust_level)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <IconCalendar className="size-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">账号创建时间</div>
                  <div className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>

              {user.last_login_at && (
                <div className="flex items-center gap-3 text-sm">
                  <IconClock className="size-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">最后登录时间</div>
                    <div className="text-muted-foreground">
                      {new Date(user.last_login_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {user?.beta !== 1 && (
          <Card className="mt-6 border-dashed">
            <CardHeader>
              <CardTitle>Beta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                我们推出了 Beta 计划，加入此计划后，您将获得部分预览功能的访问权限，这些功能可能尚不稳定，我们亦不会对因此产生的问题负责。
              </p>
              <Button
                onClick={handleJoinBetaClick}
                className="cursor-pointer"
              >
                加入 Beta 计划
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 确认对话框 */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认加入 Beta 计划</DialogTitle>
              <DialogDescription>
                一旦加入 Beta 计划，在新功能完全推出之前将无法退出。Beta 功能可能不稳定，确认继续吗？
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isJoiningBeta}
                size="lg"
                className='cursor-pointer'
              >
                取消
              </Button>
              <StatefulButton
                onClick={handleConfirmJoinBeta}
                disabled={isJoiningBeta}
                className='cursor-pointer'
              >
                确认加入
              </StatefulButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}