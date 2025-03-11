/* eslint-disable no-null/no-null */
/* eslint-disable react/jsx-props-no-spreading */
// @ts-nocheck
import React from 'react';
import { createRoot } from 'react-dom/client';

export function injectComponent<T extends {}>(Component: React.ComponentType<T>) {
  return (domRoot: HTMLElement, props?: T): ReturnType<RefObject<React.Component<T>>> | null => {
    if (!domRoot) return null;

    if (!domRoot.$aiRoot) {
      const mountNode = document.createElement('div');
      domRoot.appendChild(mountNode);

      const root = createRoot(mountNode);
      domRoot.$aiRoot = root;
    }

    // domRoot.$aiRoot.render(<Component {...(props as T)} />);
    const ref = React.createRef<R>();
    return new Promise((resolve) => {
      domRoot.$aiRoot.render(<Component {...(props as T)} ref={ref} />);
      setTimeout(() => {
        resolve(ref.current);
      }, 0);
    });
  };
}
