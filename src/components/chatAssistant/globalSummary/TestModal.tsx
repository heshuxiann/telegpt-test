/* eslint-disable no-null/no-null */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable no-console */
import React from 'react';
import { Button, Input, Modal } from 'antd';

const { TextArea } = Input;
interface TestModalProps {
  visible: boolean;
  handleReSummary: (prompt:string) => Promise<void>;
  onClose: () => void;
}
export const TestModal = (props: TestModalProps) => {
  const { visible, onClose, handleReSummary } = props;
  const [prompt, setPrompt] = React.useState<string>('');
  const handleSummary = () => {
    if (!prompt) return;
    handleReSummary(prompt);
    onClose();
  };
  return (
    <Modal width="60vw" title="测试" visible={visible} onCancel={onClose} footer={null}>
      <TextArea rows={10} placeholder="提示词" value={prompt} onChange={(e) => { setPrompt(e.target.value); }} />
      <Button type="primary" onClick={handleSummary} className="mt-[20px] mx-auto">
        重新总结
      </Button>
    </Modal>
  );
};
