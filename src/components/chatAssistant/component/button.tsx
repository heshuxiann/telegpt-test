/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-len */
import * as React from 'react';

import { cn } from '../utils/util';

interface OwnProps {
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}
const Button = ({
  className,
  disabled,
  onClick,
  children: content,
}: OwnProps) => {
  return (
    <button
      className={cn('w-[40px] h-[40px] p-[5px] border-none rounded-full box-border flex items-center justify-center hover:bg-[var(--color-interactive-element-hover)]', className)}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
};

export { Button };
