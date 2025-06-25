/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
import { useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';

type ScrollFlag = ScrollBehavior | false;

export function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: isAtBottom = false, mutate: setIsAtBottom } = useSWR(
    'messages:is-at-bottom',
    null,
    { fallbackData: false },
  );

  const { data: scrollBehavior = false, mutate: setScrollBehavior } = useSWR<ScrollFlag>('messages:should-scroll', null, { fallbackData: false });

  useEffect(() => {
    if (scrollBehavior) {
      endRef.current?.scrollIntoView({ behavior: scrollBehavior });
      setScrollBehavior(false);
    }
  }, [setScrollBehavior, scrollBehavior]);

  const scrollToBottom = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    (scrollBehavior: ScrollBehavior = 'smooth') => {
      setScrollBehavior(scrollBehavior);
    },
    [setScrollBehavior],
  );

  function onViewportEnter() {
    setIsAtBottom(true);
  }

  function onViewportLeave() {
    setIsAtBottom(false);
  }

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  };
}
