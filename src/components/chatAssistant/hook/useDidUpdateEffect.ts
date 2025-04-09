import { useEffect, useRef } from 'react';

export function useDidUpdateEffect(effect: () => void | (() => void), deps: any[]) {
  const didMountRef = useRef(false);

  useEffect(() => {
    if (didMountRef.current) {
      return effect();
    } else {
      didMountRef.current = true;
      return undefined;
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [...deps]);
}
