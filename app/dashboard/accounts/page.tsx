'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getAccounts,
  deleteAccount,
  updateAccountStatus,
  getOAuthAuthorizeUrl,
  submitOAuthCallback,
  getAccountQuotas,
  updateQuotaStatus,
  type Account
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Toaster, { ToasterRef } from '@/components/ui/toast';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconCirclePlusFilled, IconDotsVertical, IconRefresh, IconTrash, IconToggleLeft, IconToggleRight, IconExternalLink, IconChartBar } from '@tabler/icons-react';
import { MorphingSquare } from '@/components/ui/morphing-square';
import { Gemini, Claude, OpenAI } from '@lobehub/icons';

export default function AccountsPage() {
  const toasterRef = useRef<ToasterRef>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // OAuth Dialog 状态
  const [isOAuthDialogOpen, setIsOAuthDialogOpen] = useState(false);
  const [oauthUrl, setOauthUrl] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAccountType, setCurrentAccountType] = useState<number>(0);
  
  // 配额查看 Dialog 状态
  const [isQuotaDialogOpen, setIsQuotaDialogOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [quotas, setQuotas] = useState<any>(null);
  const [isLoadingQuotas, setIsLoadingQuotas] = useState(false);

  const loadAccounts = async () => {
    try {
      const data = await getAccounts();
      // 确保 data 是数组
      if (Array.isArray(data)) {
        setAccounts(data);
      } else if (data && typeof data === 'object') {
        // 如果返回的是对象,可能包含 accounts 字段
        setAccounts((data as any).accounts || []);
      } else {
        setAccounts([]);
      }
    } catch (err) {
      toasterRef.current?.show({
        title: '加载失败',
        message: err instanceof Error ? err.message : '加载账号列表失败',
        variant: 'error',
        position: 'top-right',
      });
      setAccounts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    
    // 监听账号添加事件
    const handleAccountAdded = () => {
      loadAccounts();
    };
    
    window.addEventListener('accountAdded', handleAccountAdded);
    
    return () => {
      window.removeEventListener('accountAdded', handleAccountAdded);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAccounts();
  };

  const handleAddAccount = async (isShared: number) => {
    try {
      setCurrentAccountType(isShared);
      const { auth_url } = await getOAuthAuthorizeUrl(isShared);
      setOauthUrl(auth_url);
      setCallbackUrl('');
      setIsOAuthDialogOpen(true);
    } catch (err) {
      toasterRef.current?.show({
        title: '获取授权链接失败',
        message: err instanceof Error ? err.message : '获取授权链接失败',
        variant: 'error',
        position: 'top-right',
      });
    }
  };

  const handleOpenOAuthUrl = () => {
    window.open(oauthUrl, '_blank', 'width=600,height=700');
  };

  const handleSubmitCallback = async () => {
    if (!callbackUrl.trim()) {
      toasterRef.current?.show({
        title: '输入错误',
        message: '请输入回调地址',
        variant: 'warning',
        position: 'top-right',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitOAuthCallback(callbackUrl);
      setIsOAuthDialogOpen(false);
      setCallbackUrl('');
      setOauthUrl('');
      toasterRef.current?.show({
        title: '添加成功',
        message: '账号已成功添加',
        variant: 'success',
        position: 'top-right',
      });
      // 刷新账号列表
      await loadAccounts();
    } catch (err) {
      toasterRef.current?.show({
        title: '提交失败',
        message: err instanceof Error ? err.message : '提交回调失败',
        variant: 'error',
        position: 'top-right',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (account: Account) => {
    try {
      const newStatus = account.status === 1 ? 0 : 1;
      await updateAccountStatus(account.cookie_id, newStatus);
      // 更新本地状态
      setAccounts(accounts.map(a =>
        a.cookie_id === account.cookie_id
          ? { ...a, status: newStatus }
          : a
      ));
      toasterRef.current?.show({
        title: '状态已更新',
        message: `账号已${newStatus === 1 ? '启用' : '禁用'}`,
        variant: 'success',
        position: 'top-right',
      });
    } catch (err) {
      toasterRef.current?.show({
        title: '更新失败',
        message: err instanceof Error ? err.message : '更新状态失败',
        variant: 'error',
        position: 'top-right',
      });
    }
  };

  const handleDelete = async (cookieId: string) => {
    if (!confirm('确定要删除这个账号吗?')) return;

    try {
      await deleteAccount(cookieId);
      setAccounts(accounts.filter(a => a.cookie_id !== cookieId));
      toasterRef.current?.show({
        title: '删除成功',
        message: '账号已删除',
        variant: 'success',
        position: 'top-right',
      });
    } catch (err) {
      toasterRef.current?.show({
        title: '删除失败',
        message: err instanceof Error ? err.message : '删除失败',
        variant: 'error',
        position: 'top-right',
      });
    }
  };

  const handleViewQuotas = async (account: Account) => {
    setCurrentAccount(account);
    setIsQuotaDialogOpen(true);
    setIsLoadingQuotas(true);
    setQuotas(null);
    
    try {
      const quotaData = await getAccountQuotas(account.cookie_id);
      setQuotas(quotaData);
    } catch (err) {
      toasterRef.current?.show({
        title: '加载失败',
        message: err instanceof Error ? err.message : '加载配额信息失败',
        variant: 'error',
        position: 'top-right',
      });
    } finally {
      setIsLoadingQuotas(false);
    }
  };

  const handleToggleQuotaStatus = async (modelName: string, currentStatus: number) => {
    if (!currentAccount) return;
    
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    try {
      await updateQuotaStatus(currentAccount.cookie_id, modelName, newStatus);
      // 更新本地状态
      setQuotas((prevQuotas: any) =>
        prevQuotas.map((q: any) =>
          q.model_name === modelName ? { ...q, status: newStatus } : q
        )
      );
      toasterRef.current?.show({
        title: '状态已更新',
        message: `模型 ${getModelDisplayName(modelName)} 已${newStatus === 1 ? '启用' : '禁用'}`,
        variant: 'success',
        position: 'top-right',
      });
    } catch (err) {
      toasterRef.current?.show({
        title: '更新失败',
        message: err instanceof Error ? err.message : '更新模型状态失败',
        variant: 'error',
        position: 'top-right',
      });
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
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between mb-6">
          <div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <MorphingSquare className="size-4" />
              ) : (
                <IconRefresh className="size-4" />
              )}
              <span className="ml-2">刷新</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <IconCirclePlusFilled className="size-4" />
                  <span className="ml-2">添加账号</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAddAccount(0)}>
                  添加专属账号
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddAccount(1)}>
                  添加共享账号
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 账号列表 */}
        <Toaster ref={toasterRef} defaultPosition="top-right" />
        <Card>
          <CardHeader>
            <CardTitle>我的账号</CardTitle>
            <CardDescription>
              共 {accounts.length} 个账号
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">暂无账号</p>
                <p className="text-sm">点击"添加账号"按钮添加您的第一个账号</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">账号 ID</TableHead>
                      <TableHead className="min-w-[80px]">类型</TableHead>
                      <TableHead className="min-w-[80px]">状态</TableHead>
                      <TableHead className="min-w-[100px]">添加时间</TableHead>
                      <TableHead className="min-w-[100px]">最后使用</TableHead>
                      <TableHead className="text-right min-w-[80px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.cookie_id}>
                        <TableCell className="font-mono text-sm">
                          <div className="max-w-[200px] truncate" title={account.cookie_id}>
                            {account.cookie_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.is_shared === 1 ? 'default' : 'secondary'} className="whitespace-nowrap">
                            {account.is_shared === 1 ? '共享' : '专属'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.status === 1 ? 'default' : 'outline'} className="whitespace-nowrap">
                            {account.status === 1 ? '启用' : '禁用'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(account.created_at).toLocaleDateString('zh-CN')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {account.last_used_at
                            ? new Date(account.last_used_at).toLocaleDateString('zh-CN')
                            : '从未使用'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <IconDotsVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewQuotas(account)}>
                                <IconChartBar className="size-4 mr-2" />
                                查看配额
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(account)}>
                                {account.status === 1 ? (
                                  <>
                                    <IconToggleLeft className="size-4 mr-2" />
                                    禁用
                                  </>
                                ) : (
                                  <>
                                    <IconToggleRight className="size-4 mr-2" />
                                    启用
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(account.cookie_id)}
                                className="text-red-600"
                              >
                                <IconTrash className="size-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* OAuth 授权 Dialog */}
      <Dialog open={isOAuthDialogOpen} onOpenChange={setIsOAuthDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              添加{currentAccountType === 1 ? '共享' : '专属'}账号
            </DialogTitle>
            <DialogDescription>
              请按照以下步骤完成账号授权
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* 步骤 1 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">步骤 1: 打开授权页面</Label>
              <p className="text-sm text-muted-foreground">
                点击下方按钮在新标签页中打开 ChatGPT OAuth 授权页面
              </p>
              <Button
                onClick={handleOpenOAuthUrl}
                className="w-full"
                size="lg"
                disabled={!oauthUrl}
              >
                <IconExternalLink className="size-4 mr-2" />
                打开授权页面
              </Button>
            </div>

            {/* 步骤 2 */}
            <div className="space-y-3">
              <Label htmlFor="callback-url" className="text-base font-semibold">
                步骤 2: 粘贴回调地址
              </Label>
              <p className="text-sm text-muted-foreground">
                完成授权后,复制浏览器地址栏的完整 URL 并粘贴到下方
              </p>
              <Input
                id="callback-url"
                placeholder="粘贴完整的回调 URL..."
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                className="font-mono text-sm h-12"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOAuthDialogOpen(false);
                setCallbackUrl('');
                setOauthUrl('');
              }}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitCallback}
              disabled={isSubmitting || !callbackUrl.trim()}
            >
              {isSubmitting ? (
                <>
                  <MorphingSquare className="size-4 mr-2" />
                  提交中...
                </>
              ) : (
                '完成'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 配额查看 Dialog */}
      <Dialog open={isQuotaDialogOpen} onOpenChange={setIsQuotaDialogOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>账号配额详情</DialogTitle>
            <DialogDescription>
              账号 ID: {currentAccount?.cookie_id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isLoadingQuotas ? (
              <div className="flex items-center justify-center py-12">
                <MorphingSquare message="加载配额信息..." />
              </div>
            ) : quotas && Array.isArray(quotas) && quotas.length > 0 ? (
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">模型名称</TableHead>
                      <TableHead className="min-w-[100px]">当前配额</TableHead>
                      <TableHead className="min-w-[80px]">状态</TableHead>
                      <TableHead className="min-w-[150px]">配额重置时间</TableHead>
                      <TableHead className="text-right min-w-[80px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotas.map((quota: any) => (
                      <TableRow key={quota.quota_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getModelIcon(quota.model_name)}
                            <span className="font-medium whitespace-nowrap">{getModelDisplayName(quota.model_name)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {parseFloat(quota.quota).toFixed(4)}
                        </TableCell>
                        <TableCell>
                          <span className={quota.status === 1 ? 'text-green-600 whitespace-nowrap' : 'text-muted-foreground whitespace-nowrap'}>
                            {quota.status === 1 ? '正常' : '禁用'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {quota.reset_time
                            ? new Date(quota.reset_time).toLocaleString('zh-CN')
                            : '无限制'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            isSelected={quota.status === 1}
                            onChange={() => handleToggleQuotaStatus(quota.model_name, quota.status)}
                            className="scale-75"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">暂无配额信息</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}