'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider-number-flow';
import { Tooltip } from '@/components/ui/tooltip-card';
import { getUserQuotas, sendChatCompletionStream, type UserQuotaItem, type ChatMessage } from '@/lib/api';
import { toast } from 'sonner';
import {
  MessageBranch,
  MessageBranchContent,
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
  MessageToolbar,
  MessageAttachments,
  MessageAttachment,
} from '@/components/ai-elements/message';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ai-elements/reasoning';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  PromptInput,
  PromptInputProvider,
  PromptInputBody,
  PromptInputHeader,
  PromptInputFooter,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { CopyIcon, TrashIcon, EditIcon, CheckIcon as CheckIconLucide, XIcon, PlusIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/components/ai-elements/model-selector';
import { StickyBanner } from "@/components/ui/sticky-banner";
import { CheckIcon } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface MessageType {
  key: string;
  from: 'user' | 'assistant';
  versions: {
    id: string;
    content: string;
    thinkingContent?: string;
  }[];
  attachments?: Array<{
    type: 'file';
    url: string;
    mediaType: string;
    filename: string;
  }>;
}

interface ModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

// 模型提供商映射
const getModelProvider = (modelName: string): { chef: string; chefSlug: string } => {
  const lowerName = modelName.toLowerCase();
  if (lowerName.includes('gpt') || lowerName.includes('openai')) {
    return { chef: 'OpenAI', chefSlug: 'openai' };
  } else if (lowerName.includes('claude') || lowerName.includes('anthropic')) {
    return { chef: 'Anthropic', chefSlug: 'anthropic' };
  } else if (lowerName.includes('gemini') || lowerName.includes('google')) {
    return { chef: 'Google', chefSlug: 'google' };
  } else if (lowerName.includes('llama') || lowerName.includes('meta')) {
    return { chef: 'Meta', chefSlug: 'meta' };
  }
  return { chef: '未知提供商', chefSlug: 'unknown' };
};

// 格式化模型名称
const formatModelName = (modelName: string): string => {
  let name = modelName.replace(/^(openai\/|anthropic\/|google\/|meta\/)/, '');
  name = name.replace(/(\d+)-(\d+)/g, '$1.$2');
  const parts = name.split(/[-_]/).filter(part => part.length > 0);
  return parts
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function PlaygroundPage() {
  const [models, setModels] = useState<Array<{
    id: string;
    name: string;
    chef: string;
    chefSlug: string;
    providers: string[];
    quota?: string;
    maxQuota?: string;
  }>>([]);
  const [model, setModel] = useState<string>('');
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [text, setText] = useState<string>('');
  const [status, setStatus] = useState<'submitted' | 'streaming' | 'ready' | 'error'>('ready');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [config, setConfig] = useState<ModelConfig>({
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });

  // 加载用户可用的模型
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        const quotas = await getUserQuotas();

        // 将配额数据转换为模型列表
        const modelList = quotas.map((quota: UserQuotaItem) => {
          const provider = getModelProvider(quota.model_name);
          return {
            id: quota.model_name,
            name: formatModelName(quota.model_name),
            chef: provider.chef,
            chefSlug: provider.chefSlug,
            providers: [provider.chefSlug],
            quota: quota.quota,
            maxQuota: quota.max_quota,
          };
        });

        setModels(modelList);

        // 设置默认选中第一个模型
        if (modelList.length > 0 && !model) {
          setModel(modelList[0].id);
        }
      } catch (error) {
        console.error('Failed to load models:', error);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  const selectedModelData = models.find((m) => m.id === model);

  // 发送聊天请求
  const sendChatRequest = useCallback(
    async (userContent: string, files?: any[]) => {
      if (!model) {
        toast.error('请先选择一个模型');
        return;
      }

      // 构建用户消息显示内容（包含附件信息）
      let displayContent = userContent;
      if (files && files.length > 0) {
        const fileNames = files.map(f => f.filename || 'attachment').join(', ');
        displayContent = `${userContent}\n\n[附件: ${fileNames}]`;
      }

      const userMessage: MessageType = {
        key: `user-${Date.now()}`,
        from: 'user',
        versions: [
          {
            id: `user-${Date.now()}`,
            content: userContent,
          },
        ],
        attachments: files && files.length > 0 ? files.map(f => ({
          type: 'file' as const,
          url: f.url,
          mediaType: f.mediaType || 'application/octet-stream',
          filename: f.filename || 'attachment',
        })) : undefined,
      };

      setMessages((prev) => [...prev, userMessage]);
      setStatus('streaming');

      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: MessageType = {
        key: `assistant-${Date.now()}`,
        from: 'assistant',
        versions: [
          {
            id: assistantMessageId,
            content: '',
          },
        ],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingMessageId(assistantMessageId);

      // 构建消息历史
      const chatMessages: ChatMessage[] = messages.flatMap((msg) =>
        msg.versions.map((v) => ({
          role: msg.from === 'user' ? 'user' as const : 'assistant' as const,
          content: v.content,
        }))
      );

      // 构建当前用户消息（支持多模态）
      let currentMessageContent: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
      
      if (files && files.length > 0) {
        // 如果有附件，使用多模态格式
        currentMessageContent = [];
        
        // 添加文本内容
        if (userContent) {
          currentMessageContent.push({
            type: 'text' as const,
            text: userContent,
          });
        }
        
        // 添加图片附件
        for (const file of files) {
          if (file.type === 'file' && file.mediaType?.startsWith('image/')) {
            currentMessageContent.push({
              type: 'image_url' as const,
              image_url: { url: file.url },
            });
          }
        }
      } else {
        // 没有附件，使用纯文本
        currentMessageContent = userContent;
      }

      chatMessages.push({
        role: 'user',
        content: currentMessageContent,
      });

      try {
        let fullContent = '';

        await sendChatCompletionStream(
          {
            model,
            messages: chatMessages,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
            top_p: config.topP,
            frequency_penalty: config.frequencyPenalty,
            presence_penalty: config.presencePenalty,
          },
          (chunk) => {
            fullContent += chunk;

            // 解析 <think> 标签
            const thinkMatch = fullContent.match(/<think>([\s\S]*?)<\/think>/);
            const thinkingContent = thinkMatch ? thinkMatch[1] : '';
            const responseContent = fullContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();

            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.versions.some((v) => v.id === assistantMessageId)) {
                  return {
                    ...msg,
                    versions: msg.versions.map((v) =>
                      v.id === assistantMessageId
                        ? { ...v, content: responseContent, thinkingContent }
                        : v
                    ),
                  };
                }
                return msg;
              })
            );
          },
          (error) => {
            console.error('Chat error:', error);
            toast.error(`发送失败: ${error.message}`);
            setStatus('error');
            setStreamingMessageId(null);
          },
          () => {
            setStatus('ready');
            setStreamingMessageId(null);
          }
        );
      } catch (error) {
        console.error('Chat error:', error);
        toast.error('发送失败，请重试');
        setStatus('error');
        setStreamingMessageId(null);
      }
    },
    [model, messages, config]
  );

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasFiles = Boolean(message.files && message.files.length > 0);

    if (!hasText && !hasFiles) {
      return;
    }

    setStatus('submitted');
    sendChatRequest(message.text || '', message.files);
    setText('');
  };

  // 复制消息内容
  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success('已复制到剪贴板');
    }).catch(() => {
      toast.error('复制失败');
    });
  }, []);

  // 删除消息
  const handleDeleteMessage = useCallback((messageKey: string) => {
    setMessages((prev) => prev.filter((msg) => msg.key !== messageKey));
    toast.success('消息已删除');
  }, []);

  // 开始编辑消息
  const handleStartEdit = useCallback((messageKey: string, versionId: string, content: string) => {
    setEditingMessageId(versionId);
    setEditingContent(content);
  }, []);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent('');
  }, []);

  // 保存编辑
  const handleSaveEdit = useCallback((messageKey: string, versionId: string) => {
    if (!editingContent.trim()) {
      toast.error('消息内容不能为空');
      return;
    }

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.key === messageKey) {
          return {
            ...msg,
            versions: msg.versions.map((v) =>
              v.id === versionId
                ? { ...v, content: editingContent.trim() }
                : v
            ),
          };
        }
        return msg;
      })
    );

    setEditingMessageId(null);
    setEditingContent('');
    toast.success('消息已更新');
  }, [editingContent]);

  // 自动调整 textarea 高度
  useEffect(() => {
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
    }
  }, [editingContent]);

  return (
    <div className="flex gap-4 py-4 md:gap-6 md:py-6 h-[calc(100vh-var(--header-height)-2rem)] px-4 lg:px-6">
      {/* 左侧：模型配置 */}
      <Card className="w-80 shrink-0 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 pb-8">
            模型参数
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-12 overflow-y-auto overflow-x-hidden h-full">
          {/* Temperature */}
          <div className="space-y-10">
            <Label>
              <Tooltip
                content="控制输出的随机性。较高的值（如 1.8）会使输出更随机和创造性，较低的值（如 0.2）会使其更确定和专注。"
              >
                <span className="cursor-help font-medium">Temperature</span>
              </Tooltip>
            </Label>
            <Slider
              value={[config.temperature]}
              onValueChange={(value: number[]) =>
                setConfig(prev => ({ ...prev, temperature: value[0] }))
              }
              min={0}
              max={2}
              step={0.1}
              aria-label="Temperature"
            />
          </div>

          {/* Max Tokens */}
          <div className="space-y-10">
            <Label htmlFor="maxTokens">
              <Tooltip
                content="生成的最大 token 数量。一个 token 大约相当于 4 个字符或 0.75 个单词。更高的值允许更长的响应，但也会增加成本和延迟。"
              >
                <span className="cursor-help font-medium">Max Tokens</span>
              </Tooltip>
            </Label>
            <Input
              id="maxTokens"
              type="number"
              min={0}
              value={config.maxTokens}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfig(prev => ({ ...prev, maxTokens: Math.max(0, parseInt(e.target.value) || 0) }))
              }
              className="w-full"
            />
          </div>

          {/* Top P */}
          <div className="space-y-10">
            <Label>
              <Tooltip
                content="核采样参数。控制模型考虑的 token 范围。例如，0.1 意味着只考虑概率最高的 10% 的 token。较低的值使输出更确定，较高的值增加多样性。"
              >
                <span className="cursor-help font-medium">Top P</span>
              </Tooltip>
            </Label>
            <Slider
              value={[config.topP]}
              onValueChange={(value: number[]) =>
                setConfig(prev => ({ ...prev, topP: value[0] }))
              }
              min={0}
              max={1}
              step={0.1}
              aria-label="Top P"
            />
          </div>

          {/* Frequency Penalty */}
          <div className="space-y-10">
            <Label>
              <Tooltip
                content="降低重复相同内容的可能性。正值会根据 token 在文本中出现的频率来惩罚它们，减少逐字重复的可能性。"
              >
                <span className="cursor-help font-medium">Frequency Penalty</span>
              </Tooltip>
            </Label>
            <Slider
              value={[config.frequencyPenalty]}
              onValueChange={(value: number[]) =>
                setConfig(prev => ({ ...prev, frequencyPenalty: value[0] }))
              }
              min={0}
              max={2}
              step={0.1}
              aria-label="Frequency Penalty"
            />
          </div>

          {/* Presence Penalty */}
          <div className="space-y-10">
            <Label>
              <Tooltip
                content="增加谈论新话题的可能性。正值会根据 token 是否已经出现在文本中来惩罚它们，鼓励模型探索新的主题和概念。"
              >
                <span className="cursor-help font-medium">Presence Penalty</span>
              </Tooltip>
            </Label>
            <Slider
              value={[config.presencePenalty]}
              onValueChange={(value: number[]) =>
                setConfig(prev => ({ ...prev, presencePenalty: value[0] }))
              }
              min={0}
              max={2}
              step={0.1}
              aria-label="Presence Penalty"
            />
          </div>
        </CardContent>
      </Card>

      {/* 右侧：AI Elements 聊天界面 */}
      <div className="relative flex size-full flex-col overflow-hidden rounded-lg border bg-card">
        <StickyBanner className="bg-gradient-to-b from-blue-500 to-blue-600">
          <p className="mx-0 max-w-[90%] text-white drop-shadow-md">
            我们不会存储您的对话。一旦刷新，这些信息将会丢失。
          </p>
        </StickyBanner>
        <Conversation>
          <ConversationContent>
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
              </div>
            ) : (
              messages.map(({ versions, ...message }, messageIndex) => {
                const isLastMessage = messageIndex === messages.length - 1;
                return (
                  <MessageBranch defaultBranch={0} key={message.key}>
                    <MessageBranchContent>
                      {versions.map((version) => (
                        <Message
                          from={message.from}
                          key={`${message.key}-${version.id}`}
                        >
                          {message.from === 'user' && message.attachments && message.attachments.length > 0 && (
                            <MessageAttachments>
                              {message.attachments.map((attachment, idx) => (
                                <MessageAttachment data={attachment} key={`${attachment.url}-${idx}`} />
                              ))}
                            </MessageAttachments>
                          )}
                          <MessageContent>
                            {message.from === 'assistant' && version.thinkingContent && (
                              <Reasoning isStreaming={streamingMessageId === version.id}>
                                <ReasoningTrigger />
                                <ReasoningContent>{version.thinkingContent}</ReasoningContent>
                              </Reasoning>
                            )}
                            {editingMessageId === version.id ? (
                              <div className="space-y-2 w-full">
                                <Textarea
                                  ref={editTextareaRef}
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="min-h-[100px] resize-none"
                                  placeholder="编辑消息内容..."
                                />
                                <div className="flex gap-2">
                                  <MessageAction
                                    onClick={() => handleSaveEdit(message.key, version.id)}
                                    tooltip="保存"
                                    size="sm"
                                    variant="default"
                                  >
                                    <CheckIconLucide className="size-4" />
                                  </MessageAction>
                                  <MessageAction
                                    onClick={handleCancelEdit}
                                    tooltip="取消"
                                    size="sm"
                                    variant="outline"
                                  >
                                    <XIcon className="size-4" />
                                  </MessageAction>
                                </div>
                              </div>
                            ) : (
                              <>
                                {message.from === 'assistant' && streamingMessageId === version.id && !version.content ? (
                                      <Spinner />
                                ) : (
                                  <MessageResponse>
                                    {version.content}
                                  </MessageResponse>
                                )}
                              </>
                            )}
                          </MessageContent>
                          {editingMessageId !== version.id && streamingMessageId !== version.id && (
                            <MessageToolbar className={`${message.from === 'user' ? 'justify-end' : ''} ${isLastMessage ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                              <MessageActions>
                                <MessageAction
                                  onClick={() => handleCopyMessage(version.content)}
                                  tooltip="复制"
                                >
                                  <CopyIcon className="size-4" />
                                </MessageAction>
                                <MessageAction
                                  onClick={() => handleStartEdit(message.key, version.id, version.content)}
                                  tooltip="编辑"
                                >
                                  <EditIcon className="size-4" />
                                </MessageAction>
                                <MessageAction
                                  onClick={() => handleDeleteMessage(message.key)}
                                  tooltip="删除"
                                  variant="ghost"
                                  className="hover:text-destructive"
                                >
                                  <TrashIcon className="size-4" />
                                </MessageAction>
                              </MessageActions>
                            </MessageToolbar>
                          )}
                        </Message>
                      ))}
                    </MessageBranchContent>
                  </MessageBranch>
                );
              })
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="grid shrink-0 gap-4 pt-4">
          <div className="w-full px-4 pb-4">
            <PromptInputProvider>
              <PromptInput
                onSubmit={handleSubmit}
                accept="image/*"
                multiple
                globalDrop
              >
                <PromptInputHeader>
                  <PromptInputAttachments>
                    {(attachment) => <PromptInputAttachment data={attachment} />}
                  </PromptInputAttachments>
                </PromptInputHeader>
                <PromptInputBody>
                  <PromptInputTextarea
                    onChange={(event) => setText(event.target.value)}
                    value={text}
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools>
                    <PromptInputActionMenu>
                      <PromptInputActionMenuTrigger>
                        <PlusIcon className="size-4" />
                      </PromptInputActionMenuTrigger>
                      <PromptInputActionMenuContent>
                        <PromptInputActionAddAttachments label="添加图片" />
                      </PromptInputActionMenuContent>
                    </PromptInputActionMenu>
                    <ModelSelector
                      onOpenChange={setModelSelectorOpen}
                      open={modelSelectorOpen}
                    >
                      <ModelSelectorTrigger asChild>
                        <PromptInputButton>
                          {selectedModelData?.chefSlug && (
                            <ModelSelectorLogo provider={selectedModelData.chefSlug} />
                          )}
                          {selectedModelData?.name && (
                            <ModelSelectorName>
                              {selectedModelData.name}
                            </ModelSelectorName>
                          )}
                        </PromptInputButton>
                      </ModelSelectorTrigger>
                      <ModelSelectorContent>
                        <ModelSelectorInput placeholder="搜索模型..." />
                        <ModelSelectorList>
                          {loading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              加载模型中...
                            </div>
                          ) : models.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              暂无可用模型
                            </div>
                          ) : (
                            <>
                              <ModelSelectorEmpty>未找到模型。</ModelSelectorEmpty>
                              {Array.from(new Set(models.map(m => m.chef))).map((chef) => (
                                <ModelSelectorGroup key={chef} heading={chef}>
                                  {models
                                    .filter((m) => m.chef === chef)
                                    .map((m) => (
                                      <ModelSelectorItem
                                        key={m.id}
                                        onSelect={() => {
                                          setModel(m.id);
                                          setModelSelectorOpen(false);
                                        }}
                                        value={m.id}
                                      >
                                        <ModelSelectorLogo provider={m.chefSlug} />
                                        <ModelSelectorName>{m.name}</ModelSelectorName>
                                        {model === m.id ? (
                                          <CheckIcon className="ml-auto size-4" />
                                        ) : (
                                          <div className="ml-auto size-4" />
                                        )}
                                      </ModelSelectorItem>
                                    ))}
                                </ModelSelectorGroup>
                              ))}
                            </>
                          )}
                        </ModelSelectorList>
                      </ModelSelectorContent>
                    </ModelSelector>
                  </PromptInputTools>
                  <PromptInputSubmit
                    disabled={status === 'streaming'}
                    status={status}
                  />
                </PromptInputFooter>
              </PromptInput>
            </PromptInputProvider>
          </div>
        </div>
      </div>
    </div>
  );
}