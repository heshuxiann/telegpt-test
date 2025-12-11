import { useEffect } from 'react';

import eventEmitter from '../lib/EventEmitter';

export function useEventListener(event: string, handler: (payload?: any) => void, deps: unknown[] = []) {
  useEffect(() => {
    eventEmitter.on(event, handler);
    return () => eventEmitter.off(event, handler);
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, deps);
}

export function emitEvent(event: string, payload?: unknown) {
  eventEmitter.emit(event, payload);
}
