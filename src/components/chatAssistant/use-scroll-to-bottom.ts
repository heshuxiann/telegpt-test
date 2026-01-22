import React from 'react';
import { type RefObject, useEffect, useRef } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T | null>,
  RefObject<T | null>,
] {
  // eslint-disable-next-line no-null/no-null
  const containerRef = useRef<T>(null);
  // eslint-disable-next-line no-null/no-null
  const endRef = useRef<T>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      // 防抖函数，避免过度滚动
      const debouncedScroll = () => {
        // 如果正在滚动中，跳过
        if (isScrollingRef.current) return;

        // 清除之前的定时器
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // 设置新的定时器
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = true;

          // 使用 requestAnimationFrame 优化性能
          requestAnimationFrame(() => {
            end.scrollIntoView({ behavior: 'instant', block: 'end' });

            // 滚动完成后重置标志
            setTimeout(() => {
              isScrollingRef.current = false;
            }, 100);
          });
        }, 50); // 50ms 防抖延迟
      };

      const observer = new MutationObserver((mutations) => {
        // 只处理子节点变化，忽略属性和文本变化
        const hasChildListChange = mutations.some((mutation) => mutation.type === 'childList');

        if (hasChildListChange) {
          debouncedScroll();
        }
      });

      // 只监听子节点变化，不监听属性和文本内容变化
      observer.observe(container, {
        childList: true,
        subtree: false, // 不监听深层子树变化
        attributes: false, // 不监听属性变化（防止循环）
        characterData: false, // 不监听文本变化（防止流式输出触发）
      });

      return () => {
        observer.disconnect();
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
    return undefined;
  }, []);

  return [containerRef, endRef];
}
