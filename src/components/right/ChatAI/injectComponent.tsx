/* eslint-disable react/jsx-props-no-spreading */
// @ts-nocheck
import React from 'react';
import { createRoot } from 'react-dom/client';

export function injectComponent<T>(Component: React.FC<T>) {
  return (domRoot: HTMLElement, props?: T) => {
    if (!domRoot) return;

    if (!domRoot.$aiRoot) {
      const mountNode = document.createElement('div');
      domRoot.appendChild(mountNode);

      const root = createRoot(mountNode);
      domRoot.$aiRoot = root;
    }

    domRoot.$aiRoot.render(<Component {...(props as T)} />);
  };
}
