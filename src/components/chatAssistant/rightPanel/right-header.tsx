/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';

import { CloseIcon, LeftOutlined } from '../icons';

import { DrawerKey, useDrawer } from '../globalSummary/DrawerContext';

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
      className={cx('flex items-center justify-center cursor-pointer w-[44px] h-[44px] rounded-full hover:bg-[var(--color-interactive-element-hover)]', className)}
      onClick={onClick}
    >
      {icon}
    </div>
  );
};
const RightHeader = (props: Props) => {
  const { drawerKey, onClose } = props;
  const [title, setTitle] = useState('');
  const { openDrawer } = useDrawer();
  const handleBack = useCallback(() => {
    openDrawer(DrawerKey.PersonalizeSettings, {
      activeKey: drawerKey === DrawerKey.CustomizationPrompt ? '1' : '2',
    });
  }, [drawerKey, openDrawer]);
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
    }
  }, [handleBack, drawerKey]);
  return (
    <div className="h-[56px] flex items-center relative py-[0.5rem] px-[0.8125rem]">
      {drawerKey && hasBackDrawer.includes(drawerKey) ? (
        <HeaderButton icon={<LeftOutlined size={24} />} onClick={handleBack} />
      ) : (
        <HeaderButton icon={<CloseIcon size={24} />} onClick={onClose} />
      )}
      <div className="text-[16px] font-semibold pl-[1.375rem]">{title}</div>
    </div>
  );
};

export default RightHeader;
