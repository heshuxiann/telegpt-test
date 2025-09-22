import React, { memo, useEffect, useRef } from '@teact';
import { getActions } from '../../../global';

import type { TabState } from '../../../global/types';

import { injectComponent } from '../../chatAssistant/injectComponent';

import useLastCallback from '../../../hooks/useLastCallback';

import Modal from '../../ui/Modal';
import { CreditHistory } from './CreditHistory';

import styles from './CreditsModal.module.scss';

export type OwnProps = {
  modal: TabState['creditsModal'];
};
const CreditsModal = ({ modal }: OwnProps) => {
  const containerRef = useRef<HTMLDivElement>();
  const { closeCreditsModal } = getActions();
  const injectElement = injectComponent({
    component: CreditHistory,
  });

  const handleClose = useLastCallback(() => {
    closeCreditsModal();
  });

  useEffect(() => {
    let injected: { unmount: () => void } | undefined;
    if (containerRef.current) {
      // 类型断言确保 ref 是 HTMLElement
      injected = injectElement(containerRef.current as HTMLElement);
    }
    return () => {
      injected?.unmount();
    };
  }, [injectElement]);

  if (!modal?.isOpen) {
    return undefined;
  }

  return (
    <Modal
      isOpen={Boolean(modal?.isOpen)}
      contentClassName={styles.content}
      title="Credits Detail"
      hasCloseButton
      onClose={handleClose}
    >
      <div ref={containerRef}></div>
    </Modal>
  );
};

export default memo(CreditsModal);
