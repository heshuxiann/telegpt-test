/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, {
  useEffect, useRef,
} from '../../../lib/teact/teact';

import type { AiKnowledge } from '../../chatAssistant/store/knowledge-store';

import { injectComponent } from '../../../lib/injectComponent';

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
const injectEditor = injectComponent(AIKnowledgeEditor);
const AddKnowledgeModal = ({
  type, knowledge, isOpen, onClose, onUpdate,
}: OwnProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let injected: { unmount: () => void } | undefined;
    if (editorRef.current) {
      injected = injectEditor(editorRef.current, {
        onClose,
        onUpdate,
        knowledge,
        type,
      });
    }
    return () => {
      injected?.unmount();
    };
  }, [knowledge, onClose, onUpdate, type]);
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
