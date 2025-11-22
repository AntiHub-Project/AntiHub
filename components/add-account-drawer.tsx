'use client';

import { useState, useRef } from 'react';
import { getOAuthAuthorizeUrl, submitOAuthCallback } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Button as StatefulButton } from '@/components/ui/stateful-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { IconExternalLink, IconCopy } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Toaster, { ToasterRef } from '@/components/ui/toast';

interface AddAccountDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddAccountDrawer({ open, onOpenChange, onSuccess }: AddAccountDrawerProps) {
  const toasterRef = useRef<ToasterRef>(null);
  const [step, setStep] = useState<'platform' | 'type' | 'authorize'>('platform');
  const [platform, setPlatform] = useState<'antigravity' | ''>('');
  const [accountType, setAccountType] = useState<0 | 1>(0); // 0=专属, 1=共享
  const [oauthUrl, setOauthUrl] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');

  const handleContinue = async () => {
    if (step === 'platform') {
      if (!platform) {
        toasterRef.current?.show({
          title: '选择平台',
          message: '请选择一个平台',
          variant: 'warning',
          position: 'top-right',
        });
        return;
      }
      setStep('type');
    } else if (step === 'type') {
      try {
        const { auth_url } = await getOAuthAuthorizeUrl(accountType);
        setOauthUrl(auth_url);
        setStep('authorize');
      } catch (err) {
        toasterRef.current?.show({
          title: '获取失败',
          message: err instanceof Error ? err.message : '获取授权链接失败',
          variant: 'error',
          position: 'top-right',
        });
        throw err; // 让 StatefulButton 处理错误状态
      }
    }
  };

  const handleBack = () => {
    if (step === 'type') {
      setStep('platform');
    } else if (step === 'authorize') {
      setStep('type');
      setOauthUrl('');
      setCallbackUrl('');
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

    try {
      await submitOAuthCallback(callbackUrl);
      toasterRef.current?.show({
        title: '添加成功',
        message: '账号已成功添加',
        variant: 'success',
        position: 'top-right',
      });
      // 触发账号列表刷新事件
      window.dispatchEvent(new CustomEvent('accountAdded'));
      // 成功后关闭 Drawer 并重置状态
      onOpenChange(false);
      resetState();
      onSuccess?.();
    } catch (err) {
      toasterRef.current?.show({
        title: '提交失败',
        message: err instanceof Error ? err.message : '提交回调失败',
        variant: 'error',
        position: 'top-right',
      });
      throw err; // 让 StatefulButton 处理错误状态
    }
  };

  const resetState = () => {
    setStep('platform');
    setPlatform('');
    setAccountType(0);
    setOauthUrl('');
    setCallbackUrl('');
  };

  const handleClose = () => {
    onOpenChange(false);
    // 延迟重置状态，等待动画完成
    setTimeout(resetState, 300);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>添加账号向导</DrawerTitle>
        </DrawerHeader>

        <Toaster ref={toasterRef} defaultPosition="top-right" />

        <div className="px-4 py-6 space-y-6">
          {/* 步骤 1: 选择平台 */}
          {step === 'platform' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                你希望添加哪种类型的账号？
              </p>

              <div className="space-y-3">
                <label
                  className={cn(
                    "flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors",
                    platform === 'antigravity' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <input
                    type="radio"
                    name="platform"
                    value="antigravity"
                    checked={platform === 'antigravity'}
                    onChange={(e) => setPlatform(e.target.value as 'antigravity')}
                    className="w-4 h-4"
                  />
                  <img
                    src="/antigravity-logo.png"
                    alt="狗狗反重力"
                    className="w-10 h-10 rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">狗狗反重力</h3>
                      <Badge variant="secondary">可用</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      OAuth 授权登录
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* 步骤 2: 选择账号类型 */}
          {step === 'type' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                选择 {platform === 'antigravity' ? '狗狗反重力' : ''} 账号类型
              </p>

              <div className="space-y-3">
                {/* 专属账号 */}
                <label
                  className={cn(
                    "flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors",
                    accountType === 0 ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="0"
                    checked={accountType === 0}
                    onChange={() => setAccountType(0)}
                    className="w-4 h-4 mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">专属账号</h3>
                    </div>
                    {accountType === 0 && (
                      <p className="text-xs text-red-400 mt-2">
                        此账号不会被加入共享账号池，您也不会从中获得额外的共享配额。
                      </p>
                    )}
                  </div>
                </label>

                {/* 共享账号 */}
                <label
                  className={cn(
                    "flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors",
                    accountType === 1 ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="1"
                    checked={accountType === 1}
                    onChange={() => setAccountType(1)}
                    className="w-4 h-4 mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">共享账号</h3>
                    </div>
                    {accountType === 1 && (
                      <p className="text-xs text-red-400 mt-2">
                        您的帐号将会加入共享账号池以供他人使用。作为回报，您可以获得2倍于您提交的共享账号的配额。
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* 步骤 3: OAuth 授权 */}

          {step === 'authorize' && (
            <div className="space-y-6">
              {/* 步骤 1 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">账号授权</Label>
                <p className="text-sm text-muted-foreground">
                  请完成 OAuth 授权。
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleOpenOAuthUrl}
                    className="flex-1"
                    size="lg"
                    disabled={!oauthUrl}
                  >
                    <IconExternalLink className="size-4 mr-2" />
                    打开授权页面
                  </Button>
                  <Button
                    onClick={() => {
                      if (oauthUrl) {
                        navigator.clipboard.writeText(oauthUrl);
                        toasterRef.current?.show({
                          title: '复制成功',
                          message: '授权链接已复制到剪贴板',
                          variant: 'success',
                          position: 'top-right',
                        });
                      }
                    }}
                    variant="outline"
                    size="lg"
                    disabled={!oauthUrl}
                  >
                    <IconCopy className="size-4 mr-2" />
                    复制链接
                  </Button>
                </div>
              </div>

              {/* 步骤 2 */}
              <div className="space-y-3">
                <Label htmlFor="callback-url" className="text-base font-semibold">
                  回调地址
                </Label>
                <p className="text-sm text-muted-foreground">
                  请粘贴完成授权后浏览器地址栏的完整 URL。
                </p>
                <Input
                  id="callback-url"
                  placeholder="在此处粘贴回调地址"
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                  className="font-mono text-sm h-12"
                />
              </div>

            </div>
          )}
        </div>

        <DrawerFooter className="flex flex-row gap-2">
          {step !== 'platform' && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 cursor-pointer"
            >
              上一步
            </Button>
          )}
          
          {step === 'authorize' ? (
            <StatefulButton
              onClick={handleSubmitCallback}
              disabled={!callbackUrl.trim()}
              className="flex-1 cursor-pointer"
            >
              完成添加
            </StatefulButton>
          ) : (
            <Button
              onClick={handleContinue}
              disabled={step === 'platform' && !platform}
              className="flex-1 cursor-pointer"
            >
              继续
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}