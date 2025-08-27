/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-len */
/* eslint-disable consistent-return */
/* eslint-disable no-null/no-null */
import React, {
  forwardRef,
  useEffect, useImperativeHandle, useRef, useState,
} from 'react';

import { cn } from '../utils/util';

interface InfiniteScrollProps {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface InfiniteScrollRef {
  scrollToBottom: () => void;
  restoreScrollPosition: () => void;
}

export const InfiniteScroll = forwardRef<InfiniteScrollRef, InfiniteScrollProps>((props, ref) => {
  const {
    loadMore, hasMore, children, className,
  } = props;
  const containerRef = useRef<HTMLDivElement>(undefined);
  const endRef = useRef<HTMLDivElement>(undefined);
  const isLoading = useRef(false);
  // const scrollBuffer = useRef(10); // 动态缓冲区
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [autoScrollToBottom, setAutoScrollToBottom] = useState(true);

  const scrollToBottom = () => {
    const end = endRef.current;
    if (end) {
      end.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setAutoScrollToBottom(true);
    }
  };

  useImperativeHandle(ref, () => ({
    scrollToBottom,
    restoreScrollPosition,
  }));

  // 智能保存滚动位置
  // const saveScrollPosition = useCallback(() => {
  //   const container = containerRef.current;
  //   if (!container) return;

  //   const state = {
  //     scrollTop: container.scrollTop,
  //     scrollHeight: container.scrollHeight,
  //     clientHeight: container.clientHeight,
  //     windowScrollY: window.pageYOffset,
  //     buffer: scrollBuffer.current,
  //   };

  //   sessionStorage.setItem('scrollState', JSON.stringify(state));
  // }, []);
  // 增强恢复逻辑
  const restoreScrollPosition = () => {
    if (anchorRef.current) {
      anchorRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
      setTimeout(() => { setAutoScrollToBottom(true); });
    }
  };

  // 动态缓冲区计算
  // const calculateBuffer = useCallback(() => {
  //   const container = containerRef.current;
  //   if (!container) return 10;

  //   const windowHeight = window.innerHeight;
  //   const contentHeight = container.scrollHeight;
  //   return Math.max(10, (contentHeight - windowHeight) * 0.2);
  // }, []);

  // 虚拟滚动核心逻辑
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || isLoading.current) return;

    const { scrollTop } = container;

    if (scrollTop === 0 && hasMore) {
      setAutoScrollToBottom(false);
      isLoading.current = true;
      // saveScrollPosition();
      const anchor = container.firstChild?.firstChild as HTMLDivElement || null;
      anchorRef.current = anchor;
      loadMore().finally(() => {
        isLoading.current = false;
        // scrollBuffer.current = calculateBuffer();
      });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const observer = new MutationObserver((mutations) => {
        const isOnlyButtonChanged = mutations.every((mutation) => (mutation.target as HTMLElement).closest('.message-actions') !== null);
        if (isOnlyButtonChanged) return;
        if (autoScrollToBottom) {
          end.scrollIntoView({ behavior: 'instant', block: 'end' });
        } else {
          // anchorRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
          restoreScrollPosition();
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      });

      return () => {
        observer.disconnect();
      };
    }
    return undefined;
  }, [autoScrollToBottom]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn('h-full overflow-y-auto relative', className)}
    >
      {children}
      <div ref={endRef} className="h-[10px]" />
    </div>
  );
});
