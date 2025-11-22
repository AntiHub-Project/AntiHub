'use client';

import { useEffect, useState, useRef } from 'react';
import { getAPIKeys, generateAPIKey, deleteAPIKey, getCookiePreference, updateCookiePreference, type PluginAPIKey } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconCopy, IconKey, IconTrash, IconEye, IconEyeOff, IconSettings, IconPlus, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';
import { MorphingSquare } from '@/components/ui/morphing-square';
import { cn } from '@/lib/utils';
import Toaster, { ToasterRef } from '@/components/ui/toast';

export default function SettingsPage() {
  const toasterRef = useRef<ToasterRef>(null);
  const [apiKeys, setApiKeys] = useState<PluginAPIKey[]>([]);
  const [newApiKey, setNewApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<number | null>(null);
  const [preferShared, setPreferShared] = useState<number>(0); // 0=专属优先, 1=共享优先
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);
  
  const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008';

  const loadAPIKeys = async () => {
    try {
      const data = await getAPIKeys();
      setApiKeys(data);
    } catch (err) {
      // 如果没有 API Key,这是正常的
      setApiKeys([]);
    }
  };

  const loadPreference = async () => {
    try {
      const data = await getCookiePreference();
      setPreferShared(data.prefer_shared);
    } catch (err) {
      // 如果获取失败，使用默认值
      setPreferShared(0);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadAPIKeys(), loadPreference()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleUpdatePreference = async (newPreference: number) => {
    setIsUpdatingPreference(true);

    try {
      await updateCookiePreference(newPreference);
      setPreferShared(newPreference);
      toasterRef.current?.show({
        title: '更新成功',
        message: '账号优先级已更新',
        variant: 'success',
        position: 'top-right',
      });
    } catch (err) {
      toasterRef.current?.show({
        title: '更新失败',
        message: err instanceof Error ? err.message : '更新优先级失败',
        variant: 'error',
        position: 'top-right',
      });
    } finally {
      setIsUpdatingPreference(false);
    }
  };

  const handleGenerateKey = async () => {
    setIsGenerating(true);

    try {
      const result = await generateAPIKey();
      setNewApiKey(result.key);
      setShowApiKey(true);
      setIsDialogOpen(true);
      // 重新加载列表
      await loadAPIKeys();
    } catch (err) {
      toasterRef.current?.show({
        title: '生成失败',
        message: err instanceof Error ? err.message : '生成 API Key 失败',
        variant: 'error',
        position: 'top-right',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewApiKey('');
    setShowApiKey(false);
  };

  const handleDeleteKey = async (keyId: number) => {
    if (!confirm('确定要删除此 API Key 吗？删除后将无法恢复，所有使用此密钥的应用将无法访问 AI 资源。')) {
      return;
    }

    setDeletingKeyId(keyId);

    try {
      await deleteAPIKey(keyId);
      toasterRef.current?.show({
        title: '删除成功',
        message: 'API Key 已删除',
        variant: 'success',
        position: 'top-right',
      });
      // 重新加载列表
      await loadAPIKeys();
    } catch (err) {
      toasterRef.current?.show({
        title: '删除失败',
        message: err instanceof Error ? err.message : '删除 API Key 失败',
        variant: 'error',
        position: 'top-right',
      });
    } finally {
      setDeletingKeyId(null);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toasterRef.current?.show({
      title: '复制成功',
      message: 'API Key 已复制到剪贴板',
      variant: 'success',
      position: 'top-right',
    });
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return key;
    return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-center h-64">
            <MorphingSquare />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">

        <Toaster ref={toasterRef} defaultPosition="top-right" />

        {/* API Key 管理 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  API Key 管理
                </CardTitle>
              </div>
              <Button
                onClick={handleGenerateKey}
                disabled={isGenerating}
                size="sm"
                className="gap-1"
              >
                {isGenerating ? (
                  <MorphingSquare className="size-4" />
                ) : (
                  <>
                    <IconPlus className="size-4" />
                    创建
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Keys 列表 */}
            {apiKeys.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium">我的 API Keys ({apiKeys.length})</Label>
                <div className="border rounded-lg overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 text-sm font-medium min-w-[200px]">密钥</th>
                        <th className="text-left p-3 text-sm font-medium min-w-[150px]">创建时间</th>
                        <th className="text-left p-3 text-sm font-medium min-w-[150px]">最后使用</th>
                        <th className="text-right p-3 text-sm font-medium min-w-[80px]">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeys.map((key) => (
                        <tr key={key.id} className="border-b last:border-b-0 hover:bg-muted/30">
                          <td className="p-3 text-xs font-mono text-muted-foreground">
                            <div className="max-w-[200px] truncate" title={key.key_preview}>
                              {key.key_preview}
                            </div>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(key.created_at).toLocaleString('zh-CN')}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                            {key.last_used_at
                              ? new Date(key.last_used_at).toLocaleString('zh-CN')
                              : '从未使用'
                            }
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteKey(key.id)}
                              disabled={deletingKeyId === key.id}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              {deletingKeyId === key.id ? (
                                <MorphingSquare className="size-4" />
                              ) : (
                                <IconTrash className="size-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">暂无 API Key</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 账号优先级设置 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              首选项
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* 专属账号优先 */}
              <label
                className={cn(
                  "flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors",
                  preferShared === 0 ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <input
                  type="radio"
                  name="preference"
                  value="0"
                  checked={preferShared === 0}
                  onChange={() => handleUpdatePreference(0)}
                  disabled={isUpdatingPreference}
                  className="w-4 h-4 mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">优先使用专属账号</h3>
                  </div>
                </div>
              </label>

              {/* 共享账号优先 */}
              <label
                className={cn(
                  "flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors",
                  preferShared === 1 ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <input
                  type="radio"
                  name="preference"
                  value="1"
                  checked={preferShared === 1}
                  onChange={() => handleUpdatePreference(1)}
                  disabled={isUpdatingPreference}
                  className="w-4 h-4 mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">优先使用共享账号</h3>
                  </div>
                </div>
              </label>
            </div>

            {isUpdatingPreference && (
              <div className="flex items-center justify-center py-4">
                <MorphingSquare message="更新中..." />
              </div>
            )}
          </CardContent>
        </Card>

        {/* API 端点信息 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              API 端点
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">端点地址</Label>
              <div className="flex gap-2">
                <Input
                  value={apiEndpoint}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyKey(apiEndpoint)}
                >
                  <IconCopy className="size-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
              <div className="flex gap-3">
                <IconAlertTriangle className="size-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-yellow-500">温馨提示</p>
                  <p className="font-sm text-muted-foreground">你必须提供有效的 API Key 才能访问此端点。要获取模型列表，你的账户内必须具有有效的专属账号或共享账号配额。要进行对话，请使用OpenAI格式。</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Key 弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>生成成功</DialogTitle>
            <DialogDescription>
              请妥善保存此密钥，关闭后将无法再次查看完整内容
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input
                value={showApiKey ? (newApiKey || '') : maskApiKey(newApiKey || '')}
                readOnly
                className="font-mono text-sm"
              />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <IconEyeOff className="size-4" />
                  ) : (
                    <IconEye className="size-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyKey(newApiKey)}
                >
                  <IconCopy className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCloseDialog}>
              我已保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}