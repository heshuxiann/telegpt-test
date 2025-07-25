/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';

import Icon from '../component/Icon';
import { DrawerKey, useDrawerStore } from '../global-summary/DrawerContext';

interface Props {
  drawerKey: DrawerKey | undefined;
  onClose: () => void;
}

const hasBackDrawer = [
  DrawerKey.CustomizationPrompt,
  DrawerKey.AddTopicPanel,
  DrawerKey.ChatPicker,
];

const HeaderButton = ({ icon, className, onClick }:{ icon:React.ReactNode;className?:string;onClick:()=>void }) => {
  return (
    <div
      className={cx('flex items-center justify-center cursor-pointer w-[2.75rem] h-[2.75rem] rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-interactive-element-hover)]', className)}
      onClick={onClick}
    >
      {icon}
    </div>
  );
};
const RightHeader = (props: Props) => {
  const { drawerKey, onClose } = props;
  const [title, setTitle] = useState('');
  const { openDrawer, drawerParams } = useDrawerStore();
  const handleBack = useCallback(() => {
    if (drawerParams?.onBack) {
      drawerParams.onBack();
    } else {
      openDrawer(DrawerKey.PersonalizeSettings, {
        activeKey: drawerKey === DrawerKey.CustomizationPrompt ? 0 : 1,
      });
    }
  }, [drawerKey, drawerParams, openDrawer]);
  useEffect(() => {
    switch (drawerKey) {
      case DrawerKey.PersonalizeSettings:
        setTitle('Personalized settings');
        break;
      case DrawerKey.OriginalMessages:
        setTitle('Original Messages');
        break;
      case DrawerKey.CustomizationPrompt:
      case DrawerKey.AddTopicPanel:
        setTitle('Customization');
        break;
      case DrawerKey.ChatPicker:
        setTitle('Select chat');
        break;
      default:
        setTitle('');
    }
  }, [handleBack, drawerKey]);
  return (
    <div className="h-[56px] flex items-center relative py-[0.5rem] px-[0.8125rem] w-[var(--right-column-width)]">
      {drawerKey && hasBackDrawer.includes(drawerKey) ? (
        <HeaderButton icon={<Icon name="arrow-left" className="text-[26px]" />} onClick={handleBack} />
      ) : (
        <HeaderButton icon={<Icon name="close" className="text-[26px]" />} onClick={onClose} />
      )}
      <div className="text-[1.25rem] font-[var(--font-weight-medium)] pl-[1.375rem]">{title}</div>
    </div>
  );
};

export default RightHeader;
