import React from '@teact';
import type { AiKnowledge } from '../../chatAssistant/store/knowledge-store';

import { injectComponent } from '../../chatAssistant/injectComponent';

import Modal from '../../ui/Modal';
import AIKnowledgeEditor from './AIKnowledgeEditor';

import './AIKnowledgeEditor.scss';

type OwnProps = {
  knowledge?:AiKnowledge | null;
  type: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onUpdate:()=>void;
};
const AddKnowledgeModal = ({
  type, knowledge, isOpen, onClose, onUpdate,
}: OwnProps) => {
  const editorRef = injectComponent({
    component: AIKnowledgeEditor,
    props: {
      knowledge,
      type,
      onClose,
      onUpdate,
    },
  })
  return (
    <Modal
      title="Notes"
      hasCloseButton
      isOpen={isOpen}
      onClose={onClose}
      dialogStyle="max-width: 1000px; width: 70vw; height: 60vh;"
    >
      <div className="knowledge-editor" ref={editorRef} />
    </Modal>
  );
};
export default AddKnowledgeModal;
