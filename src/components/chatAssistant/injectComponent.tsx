import React from 'react';
import ReactDOM from 'react-dom/client';

export interface InjectReactComponentOptions<P = {}> {
  component: React.ComponentType<P>;
  props?: P;
}

export function injectComponent<P extends {} = {}>({
  component: Component,
  props,
}: InjectReactComponentOptions<P>) {
  return (domRoot: HTMLElement | undefined) => {
    if (!domRoot) {
      return { unmount: () => {} };
    }

    if (!(domRoot as any)._reactRoot) {
      (domRoot as any)._reactRoot = ReactDOM.createRoot(domRoot);
    }

    try {
      // 使用 PropsWithChildren 解决 IntrinsicAttributes 类型报错
      (domRoot as any)._reactRoot.render(
        React.createElement(Component as React.ComponentType<React.PropsWithChildren<P>>, props)
      );
    } catch (err) {
      console.error('Failed to render React component:', err);
      return { unmount: () => {} };
    }

    return {
      unmount: () => {
        (domRoot as any)._reactRoot?.unmount();
        (domRoot as any)._reactRoot = null;
      },
    };
  };
}