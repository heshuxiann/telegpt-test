import type { AriaRole } from 'react';
import React from '@teact';
import type { ElementRef } from '../../../lib/teact/teact';

import type { IconName } from '../../../types/icons';

import buildClassName from '../../../util/buildClassName';
import portraitIcon from '../../chatAssistant/assets/user_portrait_icon.svg';
import { PortraitIcon } from '../../chatAssistant/utils/icons';

type OwnProps = {
  name: IconName;
  className?: string;
  style?: string;
  role?: AriaRole;
  ariaLabel?: string;
  character?: string;
  ref?: ElementRef<HTMLElement>;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

const Icon = ({
  name,
  ref,
  className,
  style,
  role,
  ariaLabel,
  character,
  onClick,
}: OwnProps) => {
  if (name === 'portrait-icon') {
    return (
      <div className={buildClassName(`icon icon-${name}`, className)}>
        <PortraitIcon />
      </div>
    );
  } else if (name === 'portrait-large-icon') {
    return (
      <div className={buildClassName(`icon icon-${name}`, className)}>
        <img src={portraitIcon} alt="" draggable={false} />
      </div>
    );
  }
  return (
    <i
      ref={ref}
      className={buildClassName(`icon icon-${name}`, className)}
      style={style}
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      data-char={character}
      role={role}
      onClick={onClick}
    />
  );
};

export default Icon;
