import React from '@teact';

const DropDownIcon = ({ size = 24, fill = 'black' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 9.5L12.5 14.5L17.5 9.5" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>

  );
};

export default DropDownIcon;
