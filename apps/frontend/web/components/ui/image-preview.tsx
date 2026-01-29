"use client"

import * as React from "react"
import { DownloadIcon } from "lucide-react"

export interface ImagePreviewProps {
  children: React.ReactNode;
  src?: string;
}

/**
 * 图片预览组件 - 用于 Markdown 渲染的图片
 * 支持点击放大、滚轮缩放、ESC 关闭、下载
 */
export function ImagePreview({ children, src }: ImagePreviewProps) {
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
    const [scale, setScale] = React.useState(1);
    const overlayRef = React.useRef<HTMLDivElement>(null);

    // 关闭预览时重置缩放
    const closePreview = React.useCallback(() => {
      setIsPreviewOpen(false);
      setScale(1);
    }, []);

    // 下载图片
    const handleDownload = React.useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (!src) return;
      
      const link = document.createElement('a');
      link.href = src;
      link.download = `image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, [src]);

    // 按 ESC 关闭预览 + 滚轮缩放
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isPreviewOpen) {
          closePreview();
        }
      };

      // 处理滚轮缩放 - 使用原生事件监听器以支持 passive: false
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.min(Math.max(0.5, prev + delta), 3));
      };
      
      if (isPreviewOpen) {
        document.addEventListener('keydown', handleKeyDown);
        // 禁止背景滚动
        document.body.style.overflow = 'hidden';
        
        // 添加滚轮事件监听器，设置 passive: false 以允许 preventDefault
        const overlay = overlayRef.current;
        if (overlay) {
          overlay.addEventListener('wheel', handleWheel, { passive: false });
        }
      }
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        
        const overlay = overlayRef.current;
        if (overlay) {
          overlay.removeEventListener('wheel', handleWheel);
        }
      };
    }, [isPreviewOpen, closePreview]);

    return (
      <>
        <span className="relative block group mt-4">
          <span
            className="cursor-pointer hover:opacity-90 transition-opacity block"
            onClick={() => setIsPreviewOpen(true)}
          >
            {children}
          </span>
          {/* 下载按钮 - 悬停时显示，位于右下角 */}
          {src && (
            <button
              type="button"
              className="absolute bottom-2 right-2 size-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-md rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center justify-center"
              onClick={handleDownload}
              title="下载图片"
            >
              <DownloadIcon className="size-4" />
            </button>
          )}
        </span>

        {/* 图片预览弹窗 */}
        {isPreviewOpen && (
          <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={closePreview}
          >
            {/* 图片容器 - 预览模式下不显示下载按钮，图片无圆角 */}
            <div
              className="max-w-[90vw] max-h-[90vh] relative [&_img]:rounded-none"
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.1s ease-out'
              }}
            >
              {children}
            </div>
          </div>
        )}
      </>
    );
}