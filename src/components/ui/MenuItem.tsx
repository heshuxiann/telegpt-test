import type { FC } from "../../lib/teact/teact";
import React, { useEffect, useRef, useState } from "../../lib/teact/teact";

import type { IconName } from "../../types/icons";

import { IS_TEST } from "../../config";
import buildClassName from "../../util/buildClassName";

import useAppLayout from "../../hooks/useAppLayout";
import useLastCallback from "../../hooks/useLastCallback";
import useOldLang from "../../hooks/useOldLang";

import Icon from "../common/icons/Icon";

import "./MenuItem.scss";

export type MenuItemProps = {
  customIcon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  onClick?: (
    e: React.SyntheticEvent<HTMLDivElement | HTMLAnchorElement>,
    arg?: number
  ) => void;
  clickArg?: number;
  onContextMenu?: (e: React.UIEvent) => void;
  href?: string;
  rel?: string;
  target?: string;
  download?: string;
  disabled?: boolean;
  destructive?: boolean;
  ariaLabel?: string;
  withWrap?: boolean;
  withPreventDefaultOnMouseDown?: boolean;
  submenu?: React.ReactNode;
} & (
  | {
      icon: "A" | "K";
      isCharIcon: true;
    }
  | {
      icon?: IconName;
      isCharIcon?: false;
    }
);

const MenuItem: FC<MenuItemProps> = (props) => {
  const {
    icon,
    isCharIcon,
    customIcon,
    className,
    children,
    onClick,
    href,
    target,
    download,
    disabled,
    destructive,
    ariaLabel,
    withWrap,
    rel = "noopener noreferrer",
    onContextMenu,
    clickArg,
    withPreventDefaultOnMouseDown,
    submenu,
  } = props;

  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState<'right' | 'left'>('right');
  const menuItemRef = useRef<any>(null);
  const submenuRef = useRef<any>(null);

  useEffect(() => {
    if (submenuOpen && menuItemRef.current && submenuRef.current) {
      const rightPanel = document.getElementById('RightColumn');
      const rightPanelReact = rightPanel?.getBoundingClientRect();
      const isRightPanelOpen = !rightPanel ? false : window.getComputedStyle(rightPanel).visibility === 'visible';
      const menuRect = menuItemRef.current.getBoundingClientRect();
      const submenuRect = submenuRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - (isRightPanelOpen && rightPanelReact ? rightPanelReact?.width : 0) - menuRect.right;
      const spaceLeft = menuRect.left;

      if (spaceRight < submenuRect.width && spaceLeft > submenuRect.width) {
        setSubmenuPosition('left');
      } else {
        setSubmenuPosition('right');
      }
    }
  }, [submenuOpen]);

  const handleMouseEnter = () => {
    if (submenu) setSubmenuOpen(true);
  };
  const handleMouseLeave = () => {
    // if (submenu) setSubmenuOpen(false);
  };

  const lang = useOldLang();
  const { isTouchScreen } = useAppLayout();
  const handleClick = useLastCallback((e: React.MouseEvent<HTMLDivElement| HTMLAnchorElement>) => {
    if (disabled || !onClick) {
      e.preventDefault();
      return;
    }
    onClick(e, clickArg);
  });

  const handleKeyDown = useLastCallback(
    (e: React.KeyboardEvent<HTMLDivElement| HTMLAnchorElement>) => {
      if (e.keyCode !== 13 && e.keyCode !== 32) {
        return;
      }

      if (disabled || !onClick) {
        e.preventDefault();

        return;
      }
      onClick(e, clickArg);
    }
  );
  const handleMouseDown = useLastCallback(
    (e: React.SyntheticEvent<HTMLDivElement | HTMLAnchorElement>) => {
      if (withPreventDefaultOnMouseDown) {
        e.preventDefault();
      }
    }
  );

  const fullClassName = buildClassName(
    "MenuItem",
    className,
    disabled && "disabled",
    destructive && "destructive",
    !isTouchScreen && "compact",
    withWrap && "wrap"
  );

  const content = (
    <>
      {!customIcon && icon && (
        <Icon
          name={isCharIcon ? "char" : icon}
          character={isCharIcon ? icon : undefined}
        />
      )}
      {customIcon}
      <div className="w-full flex items-center justify-between">
        {children}
        {submenu && <Icon name="next" className="!mr-0 !text-[var(--color-text)]"/>}
      </div>
    </>
  );

  const Wrapper = href && !disabled ? "a" : "div";
  const wrapperProps = {
    ref: menuItemRef,
    ...(href && !disabled
      ? {
          tabIndex: 0,
          className: fullClassName,
          href,
          download,
          ariaLabel,
          title: ariaLabel,
          target:
            target ||
            (href.startsWith(window.location.origin) || IS_TEST
              ? "_self"
              : "_blank"),
          rel,
          dir: lang.isRtl ? "rtl" : undefined,
          onClick,
          onMouseDown: handleMouseDown,
        }
      : {
          role: "menuitem",
          tabIndex: 0,
          className: fullClassName,
          onClick: handleClick,
          onKeyDown: handleKeyDown,
          onMouseDown: handleMouseDown,
          onContextMenu,
          ariaLabel,
          title: ariaLabel,
          dir: lang.isRtl ? "rtl" : undefined,
        }),
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    style: { position: "relative" } as React.CSSProperties,
  };

  return (
    <Wrapper {...wrapperProps}>
      {content}
      {submenu && submenuOpen && (
          <div
            ref={submenuRef}
            className={`MenuItem__submenu MenuItem__submenu--${submenuPosition}`}
            onMouseEnter={() => setSubmenuOpen(true)}
            onMouseLeave={() => setSubmenuOpen(false)}
          >
            {submenu}
          </div>
      )}
    </Wrapper>
  );
};

export default MenuItem;
