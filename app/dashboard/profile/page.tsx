'use client';

import { useEffect, useState, useRef } from 'react';
import { getCurrentUser, type UserResponse } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { IconUser, IconMail, IconCalendar, IconShield, IconClock } from '@tabler/icons-react';
import Toaster, { ToasterRef } from '@/components/ui/toast';

export default function ProfilePage() {
  const toasterRef = useRef<ToasterRef>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-4 w-full max-w-xs" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
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
                <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
}