/* eslint-disable max-len */
import React, { memo, useCallback, useState } from '../../../lib/teact/teact';

import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';
import AddKnowledgeModal from './AddKnowledgeModal';

import AIKnowledgeEmpty from '../../../assets/ai-knowledge-empty.png';

const AIKnowledgeEmptyContent = ({ onAdd }:{ onAdd:NoneToVoidFunction }) => {
  return (
    <div className="flex flex-col justify-center items-center px-[30px] pt-[120px]">
      <img src={AIKnowledgeEmpty} alt="AIKnowledge" className="w-[125px] h-[125px] mb-[12px]" />
      <span className="text-[14px] text-[#676B74]">
        You can store frequently used personal information, company details, and business materials here. During chats, the AI will use this content to generate intelligent responses.
      </span>
      <Button
        round
        color="translucent"
        className="!bg-[#8C42F0] flex flex-row items-center gap-[8px] !w-[148px] !h-[42px] !p-0 !rounded-[21px] mt-[20px]"
        onClick={onAdd}
      >
        <Icon className="text-white text-[14px]" name="add" />
        <span className="text-white">Add</span>
      </Button>
    </div>
  );
};
const AIKnowledgeContent = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
  }, []);
  const handleShowAddModal = useCallback(() => {
    setShowAddModal(true);
  }, []);
  return (
    <div>
      <AIKnowledgeEmptyContent onAdd={handleShowAddModal} />
      <AddKnowledgeModal isOpen={showAddModal} onClose={handleCloseAddModal} />
    </div>
  );
};

export default memo(AIKnowledgeContent);
