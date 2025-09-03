
/* eslint-disable no-null/no-null */
import type { ComponentType } from 'react';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface MountInSeparateRootProps {
  Component: ComponentType;
}

const MountInSeparateRoot: React.FC<MountInSeparateRootProps> = ({ Component }) => {
  useEffect(() => {
    const mountNode = document.createElement('div');
    document.body.appendChild(mountNode);

    const root = createRoot(mountNode);
    root.render(<Component />);

    return () => {
      root.unmount();
      document.body.removeChild(mountNode);
    };
  }, [Component]);

  return null;
};

export default MountInSeparateRoot;
