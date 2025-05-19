import React from 'react';
import { Button } from 'antd';

import './test-actions.scss';

interface IProps {
  summaryAllUnreadMessages?: () => Promise<void>;
  showTestModalVisible?: () => void;
}
const TestActions = (props: IProps) => {
  const { summaryAllUnreadMessages, showTestModalVisible } = props;
  // const handleNotification = () => {
  //   window.Notification.requestPermission().then((permission) => {
  //     if (permission === 'granted') {
  //       const notification = new Notification('通知标题：', {
  //         body: '通知内容',
  //         icon: 'https://pic1.zhuanstatic.com/zhuanzh/50b6ffe4-c7e3-4317-bc59-b2ec4931f325.png',
  //       });
  //       setTimeout(() => notification.close(), 5000);
  //     }
  //   });
  // };
  const handleVoiceCall = () => {
    fetch('http://10.1.4.150:3000/voice-call', {
      method: 'POST',
    });
  };
  return (
    <div className="test-actions-wrapper absolute left-[20px] bottom-[20px] flex flex-col gap-[12px]">
      <Button type="primary" onClick={summaryAllUnreadMessages}>
        Summarize all unread
      </Button>
      <Button type="primary" onClick={showTestModalVisible}>
        Test entry
      </Button>
      <Button type="primary" onClick={handleVoiceCall}>
        语音通知
      </Button>
    </div>
  );
};

export default TestActions;
