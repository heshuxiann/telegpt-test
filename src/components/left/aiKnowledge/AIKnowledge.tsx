import React from '@teact';
/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
import type { FC } from '../../../lib/teact/teact';
import {
  memo, useCallback, useEffect, useState,
} from '../../../lib/teact/teact';

import type { AiKnowledge } from '../../chatAssistant/store/knowledge-store';

import { ChataiStores } from '../../chatAssistant/store';

import useLastCallback from '../../../hooks/useLastCallback';

import Transition from '../../ui/Transition';
import AddKnowledgeModal from './AddKnowledgeModal';
import AIKnowledgeContent from './AIKnowledgeContent';
import AIKnowledgeHeader from './AIKnowledgeHeader';

export type OwnProps = {
  onReset: (forceReturnToChatList?: true | Event) => void;
};
const AIKnowledge:FC<OwnProps> = ({ onReset }) => {
  const [knowledgeList, setKnowledgeList] = useState<AiKnowledge[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [type, setType] = useState<'edit' | 'add'>('add');
  const [editKnowledge, setEditKnowledge] = useState<AiKnowledge | null>(null);
  useEffect(() => {
    ChataiStores.knowledge?.getAllKnowledge().then((knowledge) => {
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
  const handleEdit = useCallback((knowledge:AiKnowledge) => {
    setType('edit');
    setEditKnowledge(knowledge);
    setShowAddModal(true);
  }, []);
  const handleUpdate = useCallback(() => {
    setEditKnowledge(null);
    ChataiStores.knowledge?.getAllKnowledge().then((knowledge) => {
      setKnowledgeList(knowledge || []);
    });
  }, []);
  const handleDelete = useCallback((id:string) => {
    ChataiStores.knowledge?.deleteKnowledge(id).then(() => {
      setKnowledgeList((prev) => {
        return prev.filter((item) => item.id !== id);
      });
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
      name="fade"
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
