'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider-number-flow';
import { Tooltip } from '@/components/ui/tooltip-card';
import { sendChatCompletionStream, generateImage, type ChatMessage, type ImageAspectRatio, type ImageSize, type ApiType } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImgSwitch } from '@/components/ui/img-switch';
import { ImageGeneration } from '@/components/ui/ai-chat-image-generation-1';
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
import { CopyIcon, TrashIcon, EditIcon, CheckIcon as CheckIconLucide, XIcon, PlusIcon, SlidersHorizontalIcon, DownloadIcon, InfoIcon, RefreshCwIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
    // 图片生成相关
    generatedImage?: {
      data: string; // Base64 编码的图片数据
      mimeType: string;
    };
  }[];
  attachments?: Array<{
    type: 'file';
    url: string;
    mediaType: string;
    filename: string;
  }>;
}

interface ImageGenConfig {
  aspectRatio: ImageAspectRatio;
  imageSize: ImageSize;
}

// 检测是否为图片生成模型（支持双模式的模型）
const isImageGenerationModel = (modelName: string): boolean => {
  const lowerName = modelName.toLowerCase();
  return lowerName.includes('image') ||
    lowerName.includes('imagen') ||
    (lowerName.includes('gemini') && lowerName.includes('image'));
};

// 检测模型是否支持图片尺寸控制
// gemini-2.5-flash-image 不支持 imageSize，gemini-2.5-pro-image 支持
const supportsImageSize = (modelName: string): boolean => {
  const lowerName = modelName.toLowerCase();
  // gemini-2.5-flash-image 不支持 imageSize
  if (lowerName.includes('flash') && lowerName.includes('image')) {
    return false;
  }
  // gemini-2.5-pro-image 和其他模型支持
  return true;
};

interface ModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

const ANTIGRAVITY_MODELS: Record<string, string> = {
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
  'gemini-2.5-flash-thinking': 'Gemini 2.5 Flash (Thinking)',
  'gemini-2.5-flash-image': 'Gemini 2.5 Flash Image',
  'gemini-3-pro-low': 'Gemini 3 Pro (Low)',
  'gemini-3-pro-high': 'Gemini 3 Pro (High)',
  'gemini-3-pro-image': 'Gemini 3 Pro Image',
  'rev19-uic3-1p': 'Rev19 UIC3 1P',
  'gpt-oss-120b-medium': 'GPT OSS 120B (Medium)',
  'claude-sonnet-4-5': 'Claude Sonnet 4.5',
  'claude-sonnet-4-5-thinking': 'Claude Sonnet 4.5 (Thinking)',
  'claude-opus-4-5-thinking': 'Claude Opus 4.5 (Thinking)',
};

const KIRO_MODELS: Record<string, string> = {
  'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
  'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5',
  'claude-opus-4-5-20251101': 'Claude Opus 4.5',
};

// 模型提供商映射
const getModelProvider = (modelName: string): { chef: string; chefSlug: string } => {
  const lowerName = modelName.toLowerCase();
  if (lowerName.includes('gpt') || lowerName.includes('openai') || lowerName.includes('oss')) {
    return { chef: 'OpenAI', chefSlug: 'openai' };
  } else if (lowerName.includes('claude') || lowerName.includes('anthropic')) {
    return { chef: 'Anthropic', chefSlug: 'anthropic' };
  } else if (lowerName.includes('gemini') || lowerName.includes('google')) {
    return { chef: 'Google', chefSlug: 'google' };
  } else if (lowerName.includes('llama') || lowerName.includes('meta')) {
    return { chef: 'Meta', chefSlug: 'meta' };
  } else if (lowerName.includes('rev') || lowerName.includes('uic')) {
    return { chef: 'Other', chefSlug: 'unknown' };
  }
  return { chef: 'Other', chefSlug: 'unknown' };
};

// 获取所有模型列表（包含 API 类型信息）
const getAllModels = (): Array<{
  id: string;
  name: string;
  chef: string;
  chefSlug: string;
  apiType: ApiType;
}> => {
  const antigravityModels = Object.entries(ANTIGRAVITY_MODELS).map(([id, name]) => {
    const provider = getModelProvider(id);
    return {
      id,
      name,
      chef: provider.chef,
      chefSlug: provider.chefSlug,
      apiType: 'antigravity' as ApiType,
    };
  });

  const kiroModels = Object.entries(KIRO_MODELS).map(([id, name]) => {
    const provider = getModelProvider(id);
    return {
      id,
      name,
      chef: provider.chef,
      chefSlug: provider.chefSlug,
      apiType: 'kiro' as ApiType,
    };
  });

  return [...antigravityModels, ...kiroModels];
};

export default function PlaygroundPage() {
  // API 类型状态
  const [apiType, setApiType] = useState<ApiType>('antigravity');

  // 获取所有模型列表
  const allModels = getAllModels();

  const [model, setModel] = useState<string>('');
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [status, setStatus] = useState<'submitted' | 'streaming' | 'ready' | 'error'>('ready');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
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

  // 图片生成配置
  const [imageConfig, setImageConfig] = useState<ImageGenConfig>({
    aspectRatio: '1:1',
    imageSize: '1K',
  });

  // 图片生成模式（'chat' 或 'image'）
  const [imageModelMode, setImageModelMode] = useState<string | null>('chat');

  // 处理模式切换，切换时清空对话内容
  const handleModeChange = useCallback((newMode: string | null) => {
    if (newMode !== imageModelMode) {
      setMessages([]);
      setImageModelMode(newMode);
    }
  }, [imageModelMode]);

  // 当选择模型时，自动设置对应的 API 类型
  const handleModelSelect = useCallback((modelId: string, modelApiType: ApiType) => {
    setModel(modelId);
    if (modelApiType !== apiType) {
      setApiType(modelApiType);
      setMessages([]); // 切换 API 类型时清空对话
    }
    setModelSelectorOpen(false);
  }, [apiType]);

  // 初始化时设置默认模型
  useEffect(() => {
    if (allModels.length > 0 && !model) {
      setModel(allModels[0].id);
    }
  }, [allModels, model]);

  // 检测当前选择的模型是否为图片生成模型
  const isImageModel = model ? isImageGenerationModel(model) : false;

  // 当前是否处于图片生成模式（模型支持图片生成且用户选择了图片生成模式）
  const isInImageGenerationMode = isImageModel && imageModelMode === 'image';

  const selectedModelData = allModels.find((m) => m.id === model);

  // 发送图片生成请求
  // Imagen 模式下每次生成都是独立上下文，API 不发送对话历史，但 UI 会显示之前的消息
  // 支持文生图和图生图（通过 files 参数传入图片）
  const sendImageGenerationRequest = useCallback(
    async (prompt: string, files?: any[]) => {
      if (!model) {
        toast.error('请先选择一个模型');
        return;
      }

      // 构建用户消息（包含附件信息）
      const userMessage: MessageType = {
        key: `user-${Date.now()}`,
        from: 'user',
        versions: [
          {
            id: `user-${Date.now()}`,
            content: prompt,
          },
        ],
        attachments: files && files.length > 0 ? files.map(f => ({
          type: 'file' as const,
          url: f.url,
          mediaType: f.mediaType || 'application/octet-stream',
          filename: f.filename || 'attachment',
        })) : undefined,
      };

      // UI 显示之前的消息，但 API 请求只发送当前 prompt（generateImage 函数已实现）
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

      // 根据模型是否支持 imageSize 来构建配置
      const imageGenConfig: { aspectRatio: ImageAspectRatio; imageSize?: ImageSize } = {
        aspectRatio: imageConfig.aspectRatio,
      };

      // 只有支持 imageSize 的模型才发送该参数
      if (supportsImageSize(model)) {
        imageGenConfig.imageSize = imageConfig.imageSize;
      }

      // 处理图生图：提取第一张图片作为输入
      let inputImage: { mimeType: string; data: string } | undefined;
      if (files && files.length > 0) {
        const imageFile = files.find(f => f.mediaType?.startsWith('image/'));
        if (imageFile && imageFile.url) {
          // 从 data URL 中提取 base64 数据
          const dataUrlMatch = imageFile.url.match(/^data:([^;]+);base64,(.+)$/);
          if (dataUrlMatch) {
            inputImage = {
              mimeType: dataUrlMatch[1],
              data: dataUrlMatch[2],
            };
          }
        }
      }

      try {
        const response = await generateImage(
          {
            model,
            prompt,
            imageConfig: imageGenConfig,
            apiType,
            inputImage,
          },
          (error) => {
            console.error('Image generation error:', error);
            toast.error(`图片生成失败: ${error.message}`);
          },
          () => {
            // 心跳回调 - 可以用于更新 UI 状态表示连接仍然活跃
            console.log('[Playground] 收到心跳，连接活跃');
          }
        );

        if (response && response.candidates && response.candidates.length > 0) {
          const candidate = response.candidates[0];
          // 遍历所有 parts 查找 inlineData（图片数据可能不在第一个 part 中）
          const parts = candidate.content?.parts || [];
          let imageData: { data: string; mimeType: string } | null = null;
          let textContent = '';

          for (const part of parts) {
            if (part.inlineData) {
              imageData = {
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
              };
            } else if (part.text) {
              textContent += part.text;
            }
          }

          if (imageData) {
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.versions.some((v) => v.id === assistantMessageId)) {
                  return {
                    ...msg,
                    versions: msg.versions.map((v) =>
                      v.id === assistantMessageId
                        ? {
                          ...v,
                          content: textContent.trim(),
                          generatedImage: imageData!,
                        }
                        : v
                    ),
                  };
                }
                return msg;
              })
            );
          } else {
            throw new Error('响应中没有图片数据');
          }
        } else {
          throw new Error('图片生成失败，未收到有效响应');
        }

        setStatus('ready');
        setStreamingMessageId(null);
      } catch (error) {
        console.error('Image generation error:', error);
        toast.error('图片生成失败，请重试');

        // 更新消息显示错误
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.versions.some((v) => v.id === assistantMessageId)) {
              return {
                ...msg,
                versions: msg.versions.map((v) =>
                  v.id === assistantMessageId
                    ? { ...v, content: '图片生成失败，请重试' }
                    : v
                ),
              };
            }
            return msg;
          })
        );

        setStatus('error');
        setStreamingMessageId(null);
      }
    },
    [model, imageConfig, apiType]
  );

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
        let fullReasoningContent = '';

        await sendChatCompletionStream(
          {
            model,
            messages: chatMessages,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
            top_p: config.topP,
            frequency_penalty: config.frequencyPenalty,
            presence_penalty: config.presencePenalty,
            apiType,
          },
          (chunk, reasoningChunk) => {
            // 累积正常内容
            if (chunk) {
              fullContent += chunk;
            }
            // 累积思维链内容
            if (reasoningChunk) {
              fullReasoningContent += reasoningChunk;
            }

            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.versions.some((v) => v.id === assistantMessageId)) {
                  return {
                    ...msg,
                    versions: msg.versions.map((v) =>
                      v.id === assistantMessageId
                        ? {
                          ...v,
                          content: fullContent,
                          thinkingContent: fullReasoningContent || undefined
                        }
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
    [model, messages, config, apiType]
  );

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasFiles = Boolean(message.files && message.files.length > 0);

    if (!hasText && !hasFiles) {
      return;
    }

    setStatus('submitted');

    // 根据模型类型和模式选择不同的处理方式
    if (isInImageGenerationMode) {
      // 图片生成模式（支持文生图和图生图）
      sendImageGenerationRequest(message.text || '', message.files);
    } else {
      // 聊天模式（包括普通模型和图片模型的对话模式）
      sendChatRequest(message.text || '', message.files);
    }
    // 不需要手动清空 text，PromptInputProvider 会在 onSubmit 完成后自动清空
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

  // 宽高比选项
  const aspectRatioOptions: { value: ImageAspectRatio; label: string }[] = [
    { value: '1:1', label: '1:1' },
    { value: '2:3', label: '2:3' },
    { value: '3:2', label: '3:2' },
    { value: '3:4', label: '3:4' },
    { value: '4:3', label: '4:3' },
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' },
    { value: '21:9', label: '21:9' },
  ];

  // 图片尺寸选项
  const imageSizeOptions: { value: ImageSize; label: string }[] = [
    { value: '1K', label: '1K' },
    { value: '2K', label: '2K' },
    { value: '4K', label: '4K' },
  ];

  // 下载生成的图片
  const handleDownloadImage = useCallback((data: string, mimeType: string) => {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${data}`;
    link.download = `generated-image-${Date.now()}.${mimeType.split('/')[1] || 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('图片已下载');
  }, []);

  // 重新生成消息
  // 找到对应的用户消息，删除该消息及其后的所有消息，然后重新发送
  const handleRegenerate = useCallback((messageKey: string) => {
    // 找到要重新生成的消息索引
    const messageIndex = messages.findIndex(msg => msg.key === messageKey);
    if (messageIndex === -1) return;

    const targetMessage = messages[messageIndex];

    // 如果是 assistant 消息，找到它前面的 user 消息
    let userMessageIndex = messageIndex;
    let userMessage = targetMessage;

    if (targetMessage.from === 'assistant') {
      // 向前查找最近的 user 消息
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].from === 'user') {
          userMessageIndex = i;
          userMessage = messages[i];
          break;
        }
      }
    }

    if (userMessage.from !== 'user') {
      toast.error('无法找到对应的用户消息');
      return;
    }

    // 获取用户消息的内容和附件
    const userContent = userMessage.versions[0]?.content || '';
    const userAttachments = userMessage.attachments;

    // 删除用户消息及其后的所有消息
    setMessages(prev => prev.slice(0, userMessageIndex));

    // 根据当前模式重新发送
    if (isInImageGenerationMode) {
      // 图片生成模式
      const files = userAttachments?.map(att => ({
        url: att.url,
        mediaType: att.mediaType,
        filename: att.filename,
        type: att.type,
      }));
      sendImageGenerationRequest(userContent, files);
    } else {
      // 聊天模式
      const files = userAttachments?.map(att => ({
        url: att.url,
        mediaType: att.mediaType,
        filename: att.filename,
        type: att.type,
      }));
      sendChatRequest(userContent, files);
    }
  }, [messages, isInImageGenerationMode, sendImageGenerationRequest, sendChatRequest]);

  return (
    <div className="flex gap-4 py-4 md:gap-6 md:py-6 h-[calc(100vh-var(--header-height)-2rem)] px-2 md:px-4 lg:px-6">
      {/* 左侧：模型配置 - 桌面端 */}
      <Card className="hidden lg:flex w-80 shrink-0 flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 pb-8">
            {isInImageGenerationMode ? '图片生成参数' : '模型参数'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-12 overflow-y-auto overflow-x-hidden h-full">
          {isInImageGenerationMode ? (
            <>
              {/* 图片生成配置 */}
              {/* Aspect Ratio */}
              <div className="space-y-4">
                <Label>
                  <Tooltip content="生成图片的宽高比。不同的宽高比适合不同的使用场景。">
                    <span className="cursor-help font-medium">宽高比</span>
                  </Tooltip>
                </Label>
                <Select
                  value={imageConfig.aspectRatio}
                  onValueChange={(value: ImageAspectRatio) =>
                    setImageConfig(prev => ({ ...prev, aspectRatio: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择宽高比" />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatioOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image Size */}
              <div className="space-y-4">
                <Label>
                  <Tooltip content={supportsImageSize(model) ? "生成图片的分辨率。更高的分辨率会产生更清晰的图片，但可能需要更长的生成时间。" : "当前模型不支持图片尺寸控制"}>
                    <span className={`cursor-help font-medium ${!supportsImageSize(model) ? 'text-muted-foreground' : ''}`}>图片尺寸</span>
                  </Tooltip>
                </Label>
                <Select
                  value={imageConfig.imageSize}
                  onValueChange={(value: ImageSize) =>
                    setImageConfig(prev => ({ ...prev, imageSize: value }))
                  }
                  disabled={!supportsImageSize(model)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择图片尺寸" />
                  </SelectTrigger>
                  <SelectContent>
                    {imageSizeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 提示信息 */}
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground space-y-2">
                <div className='flex flex-row'><InfoIcon className='size-4 text-gray-500 shrink-0 mt-0.5 mr-1' /> 你正处于 Imagen 模式</div>
                <p className='text-xs'>在此模式下，你可以控制图片生成的参数，但每一次生成都是独立上下文。请随时切换到 Chat 模式以连续对话。如果切换，你的聊天内容将被清空，请注意保存生成的图片。</p>
              </div>
            </>
          ) : (
            <>
              {/* 聊天模型配置 */}
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
                  value={config.maxTokens}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))
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
                  min={-2}
                  max={2}
                  step={0.01}
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
                  min={-2}
                  max={2}
                  step={0.01}
                  aria-label="Presence Penalty"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 右侧：AI Elements 聊天界面 */}
      <div className="relative flex size-full flex-col overflow-hidden rounded-lg border bg-card">
        {/* 移动端：模型配置抽屉 */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="lg:hidden absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors border">
              <SlidersHorizontalIcon className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>{isInImageGenerationMode ? '图片生成参数' : '模型参数'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-12 overflow-y-auto overflow-x-hidden h-[calc(100%-4rem)] px-6 py-6">
              {isInImageGenerationMode ? (
                <>
                  {/* 图片生成配置 - 移动端 */}
                  {/* Aspect Ratio */}
                  <div className="space-y-4">
                    <Label>
                      <Tooltip content="生成图片的宽高比。不同的宽高比适合不同的使用场景。">
                        <span className="cursor-help font-medium">宽高比</span>
                      </Tooltip>
                    </Label>
                    <Select
                      value={imageConfig.aspectRatio}
                      onValueChange={(value: ImageAspectRatio) =>
                        setImageConfig(prev => ({ ...prev, aspectRatio: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择宽高比" />
                      </SelectTrigger>
                      <SelectContent>
                        {aspectRatioOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Image Size */}
                  <div className="space-y-4">
                    <Label>
                      <Tooltip content={supportsImageSize(model) ? "生成图片的分辨率。更高的分辨率会产生更清晰的图片，但可能需要更长的生成时间。" : "当前模型不支持图片尺寸控制"}>
                        <span className={`cursor-help font-medium ${!supportsImageSize(model) ? 'text-muted-foreground' : ''}`}>图片尺寸</span>
                      </Tooltip>
                    </Label>
                    <Select
                      value={imageConfig.imageSize}
                      onValueChange={(value: ImageSize) =>
                        setImageConfig(prev => ({ ...prev, imageSize: value }))
                      }
                      disabled={!supportsImageSize(model)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择图片尺寸" />
                      </SelectTrigger>
                      <SelectContent>
                        {imageSizeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 提示信息 */}
                  <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground space-y-2">
                    <div className='flex flex-row'><InfoIcon className='size-4 text-gray-500 shrink-0 mt-0.5 mr-1' /> 你正处于 Imagen 模式</div>
                    <p className='text-xs'>在此模式下，你可以控制图片生成的参数，但每一次生成都是独立上下文。请随时切换到 Chat 模式以连续对话。如果切换，你的聊天内容将被清空，请注意保存生成的图片。</p>
                  </div>
                </>
              ) : (
                <>
                  {/* 聊天模型配置 - 移动端 */}
                  {/* Temperature */}
                  <div className="space-y-10">
                    <Label>
                      <Tooltip content="控制输出的随机性。较高的值（如 1.8）会使输出更随机和创造性，较低的值（如 0.2）会使其更确定和专注。">
                        <span className="cursor-help font-medium">Temperature</span>
                      </Tooltip>
                    </Label>
                    <Slider
                      value={[config.temperature]}
                      onValueChange={(value: number[]) => setConfig(prev => ({ ...prev, temperature: value[0] }))}
                      min={0}
                      max={2}
                      step={0.1}
                      aria-label="Temperature"
                    />
                  </div>

                  {/* Max Tokens */}
                  <div className="space-y-10">
                    <Label htmlFor="maxTokens-mobile">
                      <Tooltip content="生成的最大 token 数量。一个 token 大约相当于 4 个字符或 0.75 个单词。更高的值允许更长的响应，但也会增加成本和延迟。">
                        <span className="cursor-help font-medium">Max Tokens</span>
                      </Tooltip>
                    </Label>
                    <Input
                      id="maxTokens-mobile"
                      type="number"
                      value={config.maxTokens}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  {/* Top P */}
                  <div className="space-y-10">
                    <Label>
                      <Tooltip content="核采样参数。控制模型考虑的 token 范围。例如，0.1 意味着只考虑概率最高的 10% 的 token。较低的值使输出更确定，较高的值增加多样性。">
                        <span className="cursor-help font-medium">Top P</span>
                      </Tooltip>
                    </Label>
                    <Slider
                      value={[config.topP]}
                      onValueChange={(value: number[]) => setConfig(prev => ({ ...prev, topP: value[0] }))}
                      min={0}
                      max={1}
                      step={0.1}
                      aria-label="Top P"
                    />
                  </div>

                  {/* Frequency Penalty */}
                  <div className="space-y-10">
                    <Label>
                      <Tooltip content="降低重复相同内容的可能性。正值会根据 token 在文本中出现的频率来惩罚它们，减少逐字重复的可能性。">
                        <span className="cursor-help font-medium">Frequency Penalty</span>
                      </Tooltip>
                    </Label>
                    <Slider
                      value={[config.frequencyPenalty]}
                      onValueChange={(value: number[]) => setConfig(prev => ({ ...prev, frequencyPenalty: value[0] }))}
                      min={-2}
                      max={2}
                      step={0.01}
                      aria-label="Frequency Penalty"
                    />
                  </div>

                  {/* Presence Penalty */}
                  <div className="space-y-10">
                    <Label>
                      <Tooltip content="增加谈论新话题的可能性。正值会根据 token 是否已经出现在文本中来惩罚它们，鼓励模型探索新的主题和概念。">
                        <span className="cursor-help font-medium">Presence Penalty</span>
                      </Tooltip>
                    </Label>
                    <Slider
                      value={[config.presencePenalty]}
                      onValueChange={(value: number[]) => setConfig(prev => ({ ...prev, presencePenalty: value[0] }))}
                      min={-2}
                      max={2}
                      step={0.01}
                      aria-label="Presence Penalty"
                    />
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
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
                                {version.generatedImage ? (
                                  // 图片生成完成：显示 ImageGeneration 组件包裹的图片
                                  <ImageGeneration>
                                    <img
                                      src={`data:${version.generatedImage.mimeType};base64,${version.generatedImage.data}`}
                                      alt="生成的图片"
                                      className="max-w-full h-auto object-cover"
                                      style={{ maxHeight: '512px' }}
                                    />
                                  </ImageGeneration>
                                ) : message.from === 'assistant' && streamingMessageId === version.id && !version.content ? (
                                  // 等待响应时显示 Spinner（聊天模式和图片生成模式都用）
                                  <div className="flex items-center gap-3">
                                    <Spinner />
                                    {isInImageGenerationMode && (
                                      <span className="text-sm text-muted-foreground">
                                        图片生成中，这可能需要至多需要数分钟来完成。
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  // 显示文本响应
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
                                {version.generatedImage ? (
                                  // 图片消息的操作按钮
                                  <>
                                    <MessageAction
                                      onClick={() => handleRegenerate(message.key)}
                                      tooltip="重新生成"
                                      disabled={status === 'streaming'}
                                    >
                                      <RefreshCwIcon className="size-4" />
                                    </MessageAction>
                                    <MessageAction
                                      onClick={() => handleDownloadImage(version.generatedImage!.data, version.generatedImage!.mimeType)}
                                      tooltip="下载图片"
                                    >
                                      <DownloadIcon className="size-4" />
                                    </MessageAction>
                                    <MessageAction
                                      onClick={() => handleDeleteMessage(message.key)}
                                      tooltip="删除"
                                      variant="ghost"
                                      className="hover:text-destructive"
                                    >
                                      <TrashIcon className="size-4" />
                                    </MessageAction>
                                  </>
                                ) : (
                                  // 文本消息的操作按钮
                                  <>
                                    <MessageAction
                                      onClick={() => handleRegenerate(message.key)}
                                      tooltip="重新生成"
                                      disabled={status === 'streaming'}
                                    >
                                      <RefreshCwIcon className="size-4" />
                                    </MessageAction>
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
                                  </>
                                )}
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
          <div className="w-full px-2 md:px-4 pb-4">
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
                  <PromptInputTextarea />
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
                            <ModelSelectorName className="hidden sm:inline">
                              {selectedModelData.name}
                            </ModelSelectorName>
                          )}
                        </PromptInputButton>
                      </ModelSelectorTrigger>
                      <ModelSelectorContent>
                        <ModelSelectorInput placeholder="搜索模型..." />
                        <ModelSelectorList>
                          {allModels.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              暂无可用模型
                            </div>
                          ) : (
                            <>
                              <ModelSelectorEmpty>未找到模型。</ModelSelectorEmpty>
                              {/* Antigravity 模型组 */}
                              <ModelSelectorGroup heading="Antigravity">
                                {allModels
                                  .filter((m) => m.apiType === 'antigravity')
                                  .map((m) => (
                                    <ModelSelectorItem
                                      key={m.id}
                                      onSelect={() => handleModelSelect(m.id, m.apiType)}
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
                              {/* Kiro 模型组 */}
                              <ModelSelectorGroup heading="Kiro">
                                {allModels
                                  .filter((m) => m.apiType === 'kiro')
                                  .map((m) => (
                                    <ModelSelectorItem
                                      key={m.id}
                                      onSelect={() => handleModelSelect(m.id, m.apiType)}
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
                            </>
                          )}
                        </ModelSelectorList>
                      </ModelSelectorContent>
                    </ModelSelector>
                    {/* 图片生成模式切换 - 仅对图片生成模型显示 */}
                    {isImageModel && (
                      <ImgSwitch
                        name="image-mode"
                        size="small"
                        value={imageModelMode}
                        onChange={handleModeChange}
                      >
                        <ImgSwitch.Control
                          label="Chat"
                          value="chat"
                        />
                        <ImgSwitch.Control
                          label="Imagen"
                          value="image"
                        />
                      </ImgSwitch>
                    )}
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