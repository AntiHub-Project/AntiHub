"use client"

import * as React from "react"

export interface ImageGenerationProps {
  children: React.ReactNode;
}

export function ImageGeneration({ children }: ImageGenerationProps) {
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
    const [scale, setScale] = React.useState(1);
    const overlayRef = React.useRef<HTMLDivElement>(null);

    // 关闭预览时重置缩放
    const closePreview = React.useCallback(() => {
      setIsPreviewOpen(false);
      setScale(1);
    }, []);

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
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            图片已生成。
          </span>
          <div 
            className="relative rounded-xl border bg-card max-w-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setIsPreviewOpen(true)}
          >
            {children}
          </div>
        </div>

        {/* 图片预览弹窗 */}
        {isPreviewOpen && (
          <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={closePreview}
          >
            {/* 图片容器 */}
            <div 
              className="max-w-[90vw] max-h-[90vh]"
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