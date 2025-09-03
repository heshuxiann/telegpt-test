import React from '@teact';

const CloseIcon = ({ size = 24, fill = 'black' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M22.7559 22.7559C22.4715 23.0404 22.0035 23.0335 21.7106 22.7406L10.7106 11.7406C10.4177 11.4477 10.4108 10.9797 10.6952 10.6953C10.9797 10.4108 11.4477 10.4177 11.7406 10.7106L22.7406 21.7106C23.0335 22.0035 23.0403 22.4715 22.7559 22.7559Z" fill={fill} />
      <path fillRule="evenodd" clipRule="evenodd" d="M10.8696 22.5816C10.5767 22.2887 10.5698 21.8207 10.8542 21.5363L21.5363 10.8542C21.8207 10.5698 22.2887 10.5767 22.5816 10.8696C22.8745 11.1625 22.8814 11.6305 22.5969 11.9149L11.9149 22.5969C11.6305 22.8814 11.1625 22.8745 10.8696 22.5816Z" fill={fill} />
    </svg>
  );
};

export default CloseIcon;
