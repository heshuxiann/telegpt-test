import type { ComponentType } from 'react';
import React from 'react';
import ReactDOM from 'react-dom/client';

interface InjectComponentOptions<P = any> {
  component: ComponentType<P>; // ✅ 用 ComponentType 表示组件类型
  props?: P;
}

export function injectComponent<P = any>({
  component: Component,
  props,
}: InjectComponentOptions<P>) {
  let root: ReactDOM.Root | undefined;

  // 这个 refCallback 会被 Teact 调用
  const refCallback = (el: HTMLElement | undefined) => {
    if (!el) {
      if (root) {
        root.unmount();
        root = undefined;
      }
      return;
    }

    try {
      if (!root) {
        root = ReactDOM.createRoot(el);
      }
      const element = React.createElement(Component as any, props as any);
      root.render(element);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load React component:', err);
    }
  };

  return refCallback;
}

