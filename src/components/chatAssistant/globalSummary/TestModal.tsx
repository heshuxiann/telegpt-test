/* eslint-disable react/jsx-no-bind */
/* eslint-disable no-console */
import React from 'react';
import { Button, Input, Modal } from 'antd';

const { TextArea } = Input;
interface TestModalProps {
  visible: boolean;
  onClose: () => void;
}
export const TestModal = (props: TestModalProps) => {
  const { visible, onClose } = props;
  const [prompt, setPrompt] = React.useState<string>('');
  const handleReSummary = () => {
    console.log('重新总结');
  };
  return (
    <Modal title="测试" visible={visible} onCancel={onClose}>
      <TextArea rows={4} placeholder="提示词" value={prompt} onChange={(e) => { setPrompt(e.target.value); }} />
      <Button type="primary" onClick={handleReSummary}>
        重新总结
      </Button>
    </Modal>
  );
};
