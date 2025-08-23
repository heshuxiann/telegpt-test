/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/jsx-uses-react */

// @ts-nocheck
import React, { type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

export function injectComponent<T extends object>(Component: ComponentType<T>) {
  return (domRoot: HTMLElement, props?: T): { ref: { current: any }; unmount: () => void } | null => {
    if (!domRoot) return null;

    if (!domRoot.$aiRoot) {
      const root = createRoot(domRoot);
      domRoot.$aiRoot = root;
    }

    // Create a simple ref object without using React.createRef
    const ref = { current: null };

    domRoot.$aiRoot.render(<Component {...(props as T)} />);

    return {
      ref,
      unmount: () => {
        domRoot.$aiRoot?.unmount();
        domRoot.$aiRoot = null;
      },
    };
  };
}
