/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
import type { FC } from '../../../lib/teact/teact';
import React, {
  memo, useCallback, useEffect, useState,
} from '../../../lib/teact/teact';

import { LAYERS_ANIMATION_NAME } from '../../../util/windowEnvironment';
import { globalAITask } from '../../chatAssistant/global-ai-task';
import { ChataiKnowledgelStore } from '../../chatAssistant/store';

import useLastCallback from '../../../hooks/useLastCallback';

import Transition from '../../ui/Transition';
import AddKnowledgeModal from './AddKnowledgeModal';
import AIKnowledgeContent from './AIKnowledgeContent';
import AIKnowledgeHeader from './AIKnowledgeHeader';

export type OwnProps = {
  onReset: (forceReturnToChatList?: true | Event) => void;
};
const AIKnowledge:FC<OwnProps> = ({ onReset }) => {
  const [knowledgeList, setKnowledgeList] = useState<{ id:string;content:string }[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [type, setType] = useState<'edit' | 'add'>('add');
  const [editKnowledge, setEditKnowledge] = useState<{ id:string;content:string } | null>(null);
  useEffect(() => {
    ChataiKnowledgelStore.getAllKnowledge().then((knowledge) => {
      setKnowledgeList(knowledge || []);
    });
  }, []);
  const handleReset = useLastCallback(() => {
    onReset(true);
  });
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
  }, []);
  const handleShowAddModal = useCallback((type:'edit' | 'add') => {
    setShowAddModal(true);
    setType(type);
  }, []);
  const handleEdit = useCallback((knowledge:{ id:string;content:string }) => {
    setType('edit');
    setEditKnowledge(knowledge);
    setShowAddModal(true);
  }, []);
  const handleUpdate = useCallback(() => {
    setEditKnowledge(null);
    ChataiKnowledgelStore.getAllKnowledge().then((knowledge) => {
      setKnowledgeList(knowledge || []);
      globalAITask.updateKnowledgeData();
    });
  }, []);
  const handleDelete = useCallback((id:string) => {
    ChataiKnowledgelStore.deleteKnowledge(id).then(() => {
      setKnowledgeList((prev) => {
        return prev.filter((item) => item.id !== id);
      });
      globalAITask.updateKnowledgeData();
    });
  }, []);
  function renderCurrentSection() {
    return (
      <>
        <AIKnowledgeHeader
          onReset={handleReset}
          showAddButton={knowledgeList.length > 0}
          onShowAddModal={handleShowAddModal}
        />
        <AIKnowledgeContent knowledgeList={knowledgeList} onShowAddModal={handleShowAddModal} onEdit={handleEdit} onDelete={handleDelete} />
        {showAddModal && (
          <AddKnowledgeModal type={type} isOpen={showAddModal} onClose={handleCloseAddModal} knowledge={editKnowledge} onUpdate={handleUpdate} />
        )}
      </>

    );
  }
  return (
    <Transition
      id="AiKnowledge"
      name={LAYERS_ANIMATION_NAME}
      activeKey={0}
      renderCount={1}
      shouldWrap
      withSwipeControl
    >
      {renderCurrentSection}
    </Transition>
  );
};

export default memo(AIKnowledge);
