/* eslint-disable max-len */
import React, { memo, useCallback } from '../../../lib/teact/teact';

import Button from '../../ui/Button';
import Modal from '../../ui/Modal';

type OwnProps = {
  isOpen: boolean;
  onClose: () => void;
};
const AddKnowledgeModal = ({ isOpen, onClose }:OwnProps) => {
  const handleAdd = useCallback(() => {
    // console.log('Added');
  }, []);
  return (
    <Modal
      title="Notes"
      hasCloseButton
      isOpen={isOpen}
      onClose={onClose}
    >
      <textarea rows={18} className="focus:border-[var(--color-primary)] border-[#979797] border-solid border-[1px] w-full p-4" />
      <div className="flex flex-row gap-8 justify-end mt-[20px]">
        <Button className="!w-[120px] !h-[42px]" color="translucent-bordered" onClick={onClose}>Cancel</Button>
        <Button className="!w-[120px] !h-[42px]" color="primary" onClick={handleAdd}>Add</Button>
      </div>
    </Modal>
  );
};
export default memo(AddKnowledgeModal);
