/* eslint-disable max-len */
import { v4 as uuidv4 } from 'uuid';
import React, { useCallback, useRef, useState } from '../../../lib/teact/teact';

import { ChataiKnowledgelStore } from '../../chatAssistant/store';

import Button from '../../ui/Button';
import Modal from '../../ui/Modal';

type OwnProps = {
  knowledge?:{ id:string; content:string } | null;
  type: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onUpdate:()=>void;
};
const AddKnowledgeModal = ({
  type, knowledge, isOpen, onClose, onUpdate,
}: OwnProps) => {
  const [content, setContent] = useState<string>(knowledge?.content || '');
  const knowledgeId = useRef(uuidv4());
  const handleAdd = useCallback(() => {
    ChataiKnowledgelStore.addKnowledge({
      id: type === 'add' ? knowledgeId.current : knowledge?.id as string,
      content,
    }).then(() => {
      onClose();
      onUpdate();
    });
  }, [content, knowledge?.id, onClose, onUpdate, type]);
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
  };
  return (
    <Modal
      title="Notes"
      hasCloseButton
      isOpen={isOpen}
      onClose={onClose}
    >
      <textarea
        rows={18}
        value={content}
        className="focus:border-[var(--color-primary)] border-[#979797] border-solid border-[1px] w-full p-4"
        onChange={handleChange}
      />
      <div className="flex flex-row gap-8 justify-end mt-[20px]">
        <Button className="!w-[120px] !h-[42px]" color="translucent-bordered" onClick={onClose}>Cancel</Button>
        <Button className="!w-[120px] !h-[42px]" color="primary" onClick={handleAdd}>Add</Button>
      </div>
    </Modal>
  );
};
export default AddKnowledgeModal;
