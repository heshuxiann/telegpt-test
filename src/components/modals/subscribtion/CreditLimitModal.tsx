import React, { memo, useCallback } from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import type { TabState } from '../../../global/types';

import Button from '../../ui/Button';
import Modal from '../../ui/Modal';

import styles from './CreditLimitModal.module.scss';

export type OwnProps = {
  modal: TabState['creditLimitModal'];
};

const CreditLimitModal = ({ modal }: OwnProps) => {
  const { closeCreditLimitModal, openPayPackageModal } = getActions();

  const handleClose = useCallback(() => {
    closeCreditLimitModal();
  }, [closeCreditLimitModal]);

  const handleUpgrade = useCallback(() => {
    closeCreditLimitModal();
    openPayPackageModal();
  }, [closeCreditLimitModal, openPayPackageModal]);

  if (!modal?.isOpen) {
    return undefined;
  }

  const title = modal.title || 'Upgrade Tip';
  const message = modal.message || 'You\'ve reached your credit limit. Please upgrade your plan.';

  return (
    <Modal
      isOpen={modal.isOpen}
      onClose={handleClose}
       title={title}
      className={styles.modal}
    >
      <div>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button
            className={styles.cancelButton}
            color='translucent'
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className={styles.upgradeButton}
            onClick={handleUpgrade}
          >
            Upgrade
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default memo(CreditLimitModal);
