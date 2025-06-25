import { useEffect, useRef, useState } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';

import { useScrollToBottom } from './use-scroll-to-bottom';

function scrollUntilStable({
  container,
  scrollToBottom,
  maxAttempts = 30,
  interval = 50,
}: {
  container: HTMLElement;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  maxAttempts?: number;
  interval?: number;
}) {
  let lastScrollHeight = container.scrollHeight;
  let attempts = 0;

  const tick = () => {
    const current = container.scrollHeight;

    if (current !== lastScrollHeight) {
      scrollToBottom('instant');
      lastScrollHeight = current;
      attempts = 0; // reset
    } else {
      attempts++;
    }

    if (attempts < maxAttempts) {
      requestAnimationFrame(() => setTimeout(tick, interval));
    }
  };

  tick();
}
export function useMessages({
  chatId,
  status,
}: {
  chatId: string;
  status: UseChatHelpers['status'];
}) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  const hasScrollToBottom = useRef(false);

  const [hasSentMessage, setHasSentMessage] = useState(false);

  useEffect(() => {
    if (status === 'submitted') {
      setHasSentMessage(true);
    }
  }, [status]);

  useEffect(() => {
    if (!hasScrollToBottom.current && containerRef.current) {
      scrollUntilStable({
        container: containerRef.current,
        scrollToBottom,
      });
      hasScrollToBottom.current = true;
    }
  }, [containerRef, scrollToBottom]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  };
}
