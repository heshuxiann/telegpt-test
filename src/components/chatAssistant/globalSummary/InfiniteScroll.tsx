/* eslint-disable consistent-return */
/* eslint-disable no-null/no-null */
import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';

interface InfiniteScrollProps {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  children: React.ReactNode;
}

export const InfiniteScroll = ({ loadMore, hasMore, children }: InfiniteScrollProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isLoading = useRef(false);
  const scrollBuffer = useRef(10); // 动态缓冲区
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [currentAnchor, setCurrentAnchor] = useState<HTMLDivElement | null>(null);

  // 智能保存滚动位置
  const saveScrollPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const state = {
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
      windowScrollY: window.pageYOffset,
      buffer: scrollBuffer.current,
    };

    sessionStorage.setItem('scrollState', JSON.stringify(state));
  }, []);
  // 增强恢复逻辑
  const restoreScrollPosition = () => {
    if (currentAnchor) {
      currentAnchor.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
  };

  useEffect(() => {
    restoreScrollPosition();
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [currentAnchor, children]);

  // 动态缓冲区计算
  const calculateBuffer = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 10;

    const windowHeight = window.innerHeight;
    const contentHeight = container.scrollHeight;
    return Math.max(10, (contentHeight - windowHeight) * 0.2);
  }, []);

  // 虚拟滚动核心逻辑
  const handleScroll = () => {
    if (isInitialMount) return;
    const container = containerRef.current;
    if (!container || isLoading.current) return;

    const { scrollTop } = container;

    if (scrollTop === 0 && hasMore) {
      isLoading.current = true;
      saveScrollPosition();
      const anchor = container.firstChild?.firstChild as HTMLDivElement || null;
      setCurrentAnchor(anchor);
      loadMore().finally(() => {
        isLoading.current = false;
        scrollBuffer.current = calculateBuffer();
      });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end && isInitialMount) {
      const observer = new MutationObserver(() => {
        end.scrollIntoView({ behavior: 'instant', block: 'end' });
        setTimeout(() => {
          setIsInitialMount(false);
        }, 1000);
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }
  }, [isInitialMount]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto relative"
    >
      {children}
      <div ref={endRef} className="h-[10px]" />
    </div>
  );
};
