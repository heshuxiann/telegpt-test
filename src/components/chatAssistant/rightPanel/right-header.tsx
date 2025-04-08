/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';

import { CloseIcon } from '../icons';

export enum RightPanelKey {
  OriginalMessages = 'OriginalMessages',
  PromptTemplate = 'PromptTemplate',
  CustomizationPrompt = 'CustomizationPrompt',
}

interface Props {
  rightPanelKey: RightPanelKey;
  onClose: () => void;
}

const HeaderButton = ({ icon, className, onClick }:{ icon:React.ReactNode;className?:string;onClick:()=>void }) => {
  return (
    <div
      className={cx('w-[20px] h-[20px] rounded-full bg-[#B1B1B1] flex items-center justify-center cursor-pointer', className)}
      onClick={onClick}
    >
      {icon}
    </div>
  );
};
const RightHeader = (props: Props) => {
  const { rightPanelKey, onClose } = props;
  const [title, setTitle] = useState('');
  const [backButton, setBackButton] = useState<React.ReactNode | undefined>(undefined);
  const handleBack = useCallback(() => {
    // console.log('back');
  }, []);
  useEffect(() => {
    switch (rightPanelKey) {
      case RightPanelKey.OriginalMessages:
        setTitle('Original Messages');
        break;
      case RightPanelKey.PromptTemplate:
        setTitle('Personalized settings ');
        break;
      case RightPanelKey.CustomizationPrompt:
        setTitle('Global Summary');
        setBackButton(<HeaderButton icon={<CloseIcon size={14} />} onClick={handleBack} />);
    }
  }, [handleBack, rightPanelKey]);
  return (
    <div className="h-[50px] flex items-center justify-center relative">
      {backButton}
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
