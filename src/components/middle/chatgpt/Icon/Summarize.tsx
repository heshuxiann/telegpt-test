import React from '@teact';

const Summarize = ({ size = 24, fill = 'black' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.08333 12.5003H12.9167M7.08333 15.0003H10M16.25 1.66699H4.58333C4.36232 1.66699 4.15036 1.75479 3.99408 1.91107C3.8378 2.06735 3.75 2.27931 3.75 2.50033V17.5003C3.75 17.7213 3.8378 17.9333 3.99408 18.0896C4.15036 18.2459 4.36232 18.3337 4.58333 18.3337H16.25C16.471 18.3337 16.683 18.2459 16.8393 18.0896C16.9955 17.9333 17.0833 17.7213 17.0833 17.5003V2.50033C17.0833 2.27931 16.9955 2.06735 16.8393 1.91107C16.683 1.75479 16.471 1.66699 16.25 1.66699Z" stroke={fill} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.08301 5H12.9163V9.16667H7.08301V5Z" stroke={fill} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>

  );
};

export default Summarize;
