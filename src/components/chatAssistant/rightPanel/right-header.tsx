/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';

import { ArrowLeftIcon, CloseIcon } from '../icons';

import { DrawerKey, useDrawer } from '../globalSummary/DrawerContext';

interface Props {
  drawerKey: DrawerKey | undefined;
  onClose: () => void;
}

const HeaderButton = ({ icon, className, onClick }:{ icon:React.ReactNode;className?:string;onClick:()=>void }) => {
  return (
    <div
      className={cx('flex items-center justify-center cursor-pointer', className)}
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
    openDrawer(DrawerKey.PersonalizeSettings);
  }, [openDrawer]);
  useEffect(() => {
    switch (drawerKey) {
      case DrawerKey.PersonalizeSettings:
        setTitle('Personalized settings');
        break;
      case DrawerKey.OriginalMessages:
        setTitle('Original Messages');
        break;
      case DrawerKey.CustomizationPrompt:
        setTitle('Customization');
    }
  }, [handleBack, drawerKey]);
  return (
    <div className="h-[50px] flex items-center justify-center relative">
      {drawerKey === DrawerKey.CustomizationPrompt ? (
        <HeaderButton className="absolute left-[18px]" icon={<ArrowLeftIcon size={24} />} onClick={handleBack} />
      ) : null}
      <span className="text-[16px] font-semibold">{title}</span>
      <div
        className="w-[20px] h-[20px] rounded-full bg-[#B1B1B1] flex items-center justify-center absolute right-[18px] top-[15px] cursor-pointer"
        onClick={onClose}
      >
        <CloseIcon size={14} />
      </div>
    </div>
  );
};

export default RightHeader;
