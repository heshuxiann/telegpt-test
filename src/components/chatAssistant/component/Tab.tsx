import type { FC } from 'react';
import React, { useEffect, useLayoutEffect, useRef } from 'react';

import { requestForcedReflow, requestMutation } from '../../../lib/fasterdom/fasterdom';
import { MouseButton } from '../../../util/browser/windowEnvironment';
import buildClassName from '../../../util/buildClassName';
import forceReflow from '../../../util/forceReflow';
import renderText from '../../common/helpers/renderText';

import { useFastClick } from '../../../hooks/useFastClick';

import './Tab.scss';

type OwnProps = {
  className?: string;
  title: string;
  isActive?: boolean;
  badgeCount?: number;
  isBadgeActive?: boolean;
  previousActiveTab?: number;
  onClick?: (arg: number) => void;
  clickArg?: number;
};

const classNames = {
  active: 'Tab--active',
  badgeActive: 'Tab__badge--active',
};

const Tab: FC<OwnProps> = ({
  className,
  title,
  isActive,
  badgeCount,
  isBadgeActive,
  previousActiveTab,
  onClick,
  clickArg,
}) => {
  // eslint-disable-next-line no-null/no-null
  const tabRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Set initial active state
    if (isActive && previousActiveTab === undefined && tabRef.current) {
      tabRef.current!.classList.add(classNames.active);
    }
  }, [isActive, previousActiveTab]);

  useEffect(() => {
    if (!isActive || previousActiveTab === undefined) {
      return;
    }

    const tabEl = tabRef.current!;
    const prevTabEl = tabEl.parentElement!.children[previousActiveTab];
    if (!prevTabEl) {
      // The number of tabs in the parent component has decreased. It is necessary to add the active tab class name.
      if (isActive && !tabEl.classList.contains(classNames.active)) {
        requestMutation(() => {
          tabEl.classList.add(classNames.active);
        });
      }
      return;
    }

    const platformEl = tabEl.querySelector<HTMLElement>('.platform')!;
    const prevPlatformEl = prevTabEl.querySelector<HTMLElement>('.platform')!;

    // We move and resize the platform, so it repeats the position and size of the previous one
    const shiftLeft = prevPlatformEl.parentElement!.offsetLeft - platformEl.parentElement!.offsetLeft;
    const scaleFactor = prevPlatformEl.clientWidth / platformEl.clientWidth;

    requestMutation(() => {
      prevPlatformEl.classList.remove('animate');
      platformEl.classList.remove('animate');
      platformEl.style.transform = `translate3d(${shiftLeft}px, 0, 0) scale3d(${scaleFactor}, 1, 1)`;

      requestForcedReflow(() => {
        forceReflow(platformEl);

        return () => {
          platformEl.classList.add('animate');
          platformEl.style.transform = 'none';

          prevTabEl.classList.remove(classNames.active);
          tabEl.classList.add(classNames.active);
        };
      });
    });
  }, [isActive, previousActiveTab]);

  const { handleClick, handleMouseDown } = useFastClick((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.type === 'mousedown' && e.button !== MouseButton.Main) {
      return;
    }

    onClick?.(clickArg!);
  });
  return (
    <div
      className={buildClassName('Tab', onClick && 'Tab--interactive', className)}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      ref={tabRef}
    >
      <span className="Tab_inner">
        {renderText(title)}
        {Boolean(badgeCount) && (
          <span className={buildClassName('badge', isBadgeActive && classNames.badgeActive)}>{badgeCount}</span>
        )}
        <i className="platform" />
      </span>
    </div>
  );
};

export default Tab;
