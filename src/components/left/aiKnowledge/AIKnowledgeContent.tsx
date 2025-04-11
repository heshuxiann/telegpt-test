/* eslint-disable max-len */
import React, { memo, useCallback } from '../../../lib/teact/teact';

import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';

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
const AIKnowledgeList = ({ knowledgeList, onEdit, onDelete }:{
  knowledgeList:any[];
  onEdit:(knowledge:{ id:string;content:string })=>void;
  onDelete:(id:string)=>void;
}) => {
  const handleEdit = useCallback((knowledge:{ id:string;content:string }) => {
    onEdit(knowledge);
  }, [onEdit]);
  const handleDelete = useCallback((knowledge:{ id:string;content:string }) => {
    onDelete(knowledge.id);
  }, [onDelete]);
  return (
    <div className="px-[20px]">
      {knowledgeList.map((item) => (
        <div key={item.id} className="bg-[#F7F7F7] rounded-[12px] px-[16px] py-[15px] mb-[12px]">
          <div className="white-space-pre-wrap line-clamp-3 overflow-hidden text-ellipsis">
            {item.content}
          </div>
          <div className="flex justify-end gap-[8px] items-center">
            <Button
              round
              size="smaller"
              color="translucent"
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => handleEdit(item)}
            >
              <Icon name="edit" className="text-[14px]" />
            </Button>
            <Button
              round
              size="smaller"
              color="translucent"
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => handleDelete(item)}
            >
              <Icon name="delete" className="text-[14px]" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
const AIKnowledgeContent = ({
  knowledgeList, onShowAddModal, onEdit, onDelete,
}:{
  knowledgeList:any[];
  onShowAddModal:(type:'edit' | 'add')=>void ;
  onEdit:(knowledge:{ id:string;content:string })=>void;
  onDelete:(id:string)=>void;
}) => {
  const handleAdd = useCallback(() => {
    onShowAddModal('add');
  }, [onShowAddModal]);
  return (
    <div className="pt-[20px] h-full box-border">
      {knowledgeList.length === 0 ? (
        <AIKnowledgeEmptyContent onAdd={handleAdd} />
      ) : (
        <AIKnowledgeList knowledgeList={knowledgeList} onEdit={onEdit} onDelete={onDelete} />
      )}
    </div>
  );
};

export default memo(AIKnowledgeContent);
