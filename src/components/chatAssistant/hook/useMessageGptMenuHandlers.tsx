import type { RefObject } from 'react';
import { useEffect, useState } from '../../../lib/teact/teact';

const useMessageGptMenuHandlers = (
  elementRef: RefObject<HTMLElement>,
) => {
  const [isGptMenuOpen, setIsGptMenuOpen] = useState(false);
  const [gptMenuPosition, setGptMenuPosition] = useState<'top' | 'bottom'>('bottom');
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line no-null/no-null
    let scrollTimeout: number | null = null;

    const onScroll = () => {
      setIsScrolling(true);
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        setIsScrolling(false);
      }, 200);
    };

    window.addEventListener('scroll', onScroll, true); // 监听冒泡阶段的滚动事件

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
    };
  }, []);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return undefined;

    const handleMouseEnter = () => {
      if (isScrolling) return;
      const rect = el.getBoundingClientRect();
      const distanceToBottom = window.innerHeight - rect.bottom;

      if (distanceToBottom < 150) {
        setGptMenuPosition('top');
      } else {
        setGptMenuPosition('bottom');
      }
      setIsGptMenuOpen(true);
    };
    const handleMouseLeave = () => setIsGptMenuOpen(false);

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [elementRef, isScrolling]);

  return { isGptMenuOpen, gptMenuPosition };
};

export default useMessageGptMenuHandlers;
