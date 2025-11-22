'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import ColourfulText from '@/components/ui/colourful-text';
import {
  IconRocket,
  IconShield,
  IconBolt,
  IconUsers,
  IconChartBar,
  IconKey,
  IconArrowRight,
  IconBrandGithub,
  IconSparkles
} from '@tabler/icons-react';
import Hyperspeed from '@/components/Hyperspeed';
import { hyperspeedPresets } from '@/lib/hyperspeed-presets';
import LogoLoop from '@/components/LogoLoop';
import { Gemini, OpenAI, Anthropic, DeepSeek, XAI, Minimax, Qwen, Mistral } from '@lobehub/icons';
import { Header } from '@/components/ui/header-1';
import { ShinyButton } from "@/components/ui/shiny-button";
import { isAuthenticated } from '@/lib/api';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header />

      {/* Hero Section with Hyperspeed Background */}
      <section className="relative h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        {/* Hyperspeed Background */}
        <div className="absolute inset-0 z-0">
          <Hyperspeed effectOptions={hyperspeedPresets.one as any} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-20 md:py-32">
          <div className="flex flex-col items-center text-center space-y-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl text-white">
              共享 AI 算力
              <br />
              释放<ColourfulText text="无限可能" />
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-12 mt-16 w-full max-w-4xl">
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-white">10+</div>
                <div className="text-sm text-gray-400">AI 模型</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-white">1000+</div>
                <div className="text-sm text-gray-400">活跃用户</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-white">99.9%</div>
                <div className="text-sm text-gray-400">可用性</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-400">技术支持</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Loop Section */}
      <section className="relative bg-black py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <p className="text-center text-md text-white mb-8 font-semibold">被合作伙伴深深信任</p>
          <div className="h-24 relative overflow-hidden">
            <LogoLoop
              logos={[
                {
                  node: <Gemini.Color className="size-12" />,
                  title: 'Google Gemini',
                  href: 'https://gemini.google.com'
                },
                {
                  node: <OpenAI className="size-12" />,
                  title: 'OpenAI',
                  href: 'https://openai.com'
                },
                {
                  node: <Anthropic className="size-12" />,
                  title: 'Anthropic',
                  href: 'https://anthropic.com'
                },
                {
                  node: <DeepSeek className="size-12" />,
                  title: 'DeepSeek',
                  href: 'https://deepseek.com'
                },
                {
                  node: <XAI className="size-12" />,
                  title: 'xAI (Grok)',
                  href: 'https://x.ai'
                },
                {
                  node: <Minimax className="size-12" />,
                  title: 'Minimax',
                  href: 'https://www.minimaxi.com'
                },
                {
                  node: <Qwen className="size-12" />,
                  title: 'Qwen',
                  href: 'https://qwenlm.github.io'
                },
                {
                  node: <Mistral className="size-12" />,
                  title: 'Mistral AI',
                  href: 'https://mistral.ai'
                },
                {
                  node: <Gemini.Color className="size-12" />,
                  title: 'Google Gemini',
                  href: 'https://gemini.google.com'
                },
                {
                  node: <OpenAI className="size-12" />,
                  title: 'OpenAI',
                  href: 'https://openai.com'
                },
                {
                  node: <Anthropic className="size-12" />,
                  title: 'Anthropic',
                  href: 'https://anthropic.com'
                },
                {
                  node: <DeepSeek className="size-12" />,
                  title: 'DeepSeek',
                  href: 'https://deepseek.com'
                },
                {
                  node: <XAI className="size-12" />,
                  title: 'xAI (Grok)',
                  href: 'https://x.ai'
                },
                {
                  node: <Minimax className="size-12" />,
                  title: 'Minimax',
                  href: 'https://www.minimaxi.com'
                },
                {
                  node: <Qwen className="size-12" />,
                  title: 'Qwen',
                  href: 'https://qwenlm.github.io'
                },
                {
                  node: <Mistral className="size-12" />,
                  title: 'Mistral AI',
                  href: 'https://mistral.ai'
                },
              ]}
              speed={120}
              direction="left"
              logoHeight={48}
              gap={80}
              hoverSpeed={0}
              scaleOnHover
              fadeOut
              fadeOutColor="#000000"
              ariaLabel="合作伙伴"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative bg-gradient-to-b from-black via-gray-900/50 to-black py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="secondary" className="px-4 py-1.5 bg-white/10 border-white/20 text-white">功能特性</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              为什么选择 AntiHub
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              我们提供最先进的 AI 资源管理和共享解决方案
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSpotlight>
              <div className="size-12 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                <IconRocket className="size-6 text-white" />
              </div>
              <p className="text-xl font-bold relative z-20 mb-2 text-white">
                快速部署
              </p>
              <p className="text-neutral-300 mt-4 relative z-20 text-sm">
                一键接入多个 AI 模型，无需复杂配置，即刻开始使用
              </p>
            </CardSpotlight>

            <CardSpotlight>
              <div className="size-12 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                <IconShield className="size-6 text-white" />
              </div>
              <p className="text-xl font-bold relative z-20 mb-2 text-white">
                安全可靠
              </p>
              <p className="text-neutral-300 mt-4 relative z-20 text-sm">
                企业级安全保障，数据加密传输，保护您的隐私和数据安全
              </p>
            </CardSpotlight>

            <CardSpotlight>
              <div className="size-12 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                <IconBolt className="size-6 text-white" />
              </div>
              <p className="text-xl font-bold relative z-20 mb-2 text-white">
                高性能
              </p>
              <p className="text-neutral-300 mt-4 relative z-20 text-sm">
                优化的资源调度算法，确保最快的响应速度和最佳性能
              </p>
            </CardSpotlight>

            <CardSpotlight>
              <div className="size-12 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                <IconUsers className="size-6 text-white" />
              </div>
              <p className="text-xl font-bold relative z-20 mb-2 text-white">
                共享机制
              </p>
              <p className="text-neutral-300 mt-4 relative z-20 text-sm">
                通过共享账号获得额外配额，降低使用成本，实现互利共赢
              </p>
            </CardSpotlight>

            <CardSpotlight>
              <div className="size-12 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                <IconChartBar className="size-6 text-white" />
              </div>
              <p className="text-xl font-bold relative z-20 mb-2 text-white">
                实时监控
              </p>
              <p className="text-neutral-300 mt-4 relative z-20 text-sm">
                详细的使用统计和配额监控，让您随时掌握资源使用情况
              </p>
            </CardSpotlight>

            <CardSpotlight>
              <div className="size-12 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                <IconKey className="size-6 text-white" />
              </div>
              <p className="text-xl font-bold relative z-20 mb-2 text-white">
                API 管理
              </p>
              <p className="text-neutral-300 mt-4 relative z-20 text-sm">
                灵活的 API Key 管理，支持多密钥，方便团队协作使用
              </p>
            </CardSpotlight>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-black py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="bg-black/50 backdrop-blur">
            <div className="flex flex-col items-center text-center space-y-6 py-16 px-6">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl">
                准备好开始了吗？
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl">
                立即注册 AntiHub，体验全新的 AI 资源共享方式
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link href={isLoggedIn ? "/dashboard" : "/auth"}>
                  <ShinyButton>{isLoggedIn ? "进入控制台" : "获取访问权限"}</ShinyButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-12">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo_dark.png" alt="AntiHub" className="h-6" />
                <span className="font-bold">AntiHub</span>
              </div>
              <p className="text-sm text-gray-400">
                共享 AI 算力，释放无限可能
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">产品</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">功能特性</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">价格</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">仪表板</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">资源</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/dashboard/help" className="hover:text-white transition-colors">帮助中心</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API 文档</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">社区</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">关于</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#about" className="hover:text-white transition-colors">关于我们</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">联系我们</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">隐私政策</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400 text-center md:text-left">
              © 2025 AntiHub. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <IconBrandGithub className="size-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
