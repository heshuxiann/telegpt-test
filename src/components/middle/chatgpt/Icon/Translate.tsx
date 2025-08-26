import React from '@teact';

const Translate = ({ size = 24, fill = 'black' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M18.5 10.5V4.5C18.5 3.96957 18.2893 3.46086 17.9142 3.08579C17.5391 2.71071 17.0304 2.5 16.5 2.5H10.5C9.96957 2.5 9.46086 2.71071 9.08579 3.08579C8.71071 3.46086 8.5 3.96957 8.5 4.5V10.5C8.5 11.0304 8.71071 11.5391 9.08579 11.9142C9.46086 12.2893 9.96957 12.5 10.5 12.5H16.5C17.0304 12.5 17.5391 12.2893 17.9142 11.9142C18.2893 11.5391 18.5 11.0304 18.5 10.5Z" stroke={fill} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 8.50293H4.5C3.96957 8.50293 3.46086 8.71364 3.08579 9.08872C2.71071 9.46379 2.5 9.9725 2.5 10.5029V16.5029C2.5 17.0334 2.71071 17.5421 3.08579 17.9171C3.46086 18.2922 3.96957 18.5029 4.5 18.5029H4.503L10.503 18.4929C11.0329 18.4921 11.5409 18.2811 11.9153 17.9061C12.2897 17.5311 12.5 17.0228 12.5 16.4929V14.4999M7.5 12.5029H4.5" stroke={fill} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 14L8 15C7.66667 15.3333 6.83333 15.8333 5.5 16.5" stroke={fill} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 12.503C5.834 13.6697 6.334 14.5027 7 15.002C8 15.75 8.5 16 9.5 16.5M10.5 10.5L13.5 4.5L16.5 10.5M15.5 8.5H11.5" stroke={fill} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default Translate;
