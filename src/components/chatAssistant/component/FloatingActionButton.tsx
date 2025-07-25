import type { FC } from 'react';
import React from 'react';

import buildClassName from '../../../util/buildClassName';

import './FloatingActionButton.scss';

type OwnProps = {
  isShown: boolean;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const FloatingActionButton: FC<OwnProps> = ({
  isShown,
  className,
  disabled,
  onClick,
  children,
}) => {
  const buttonClassName = buildClassName(
    'FloatingActionButton',
    'w-[3.5rem] bg-[var(--color-primary)] h-[3.5rem] rounded-full flex items-center justify-center',
    isShown && 'revealed',
    className,
  );

  return (
    <button
      className={buttonClassName}
      disabled={disabled}
      onClick={isShown && !disabled ? onClick : undefined}
      tabIndex={-1}
    >
      {children}
    </button>
  );
};

export default FloatingActionButton;
