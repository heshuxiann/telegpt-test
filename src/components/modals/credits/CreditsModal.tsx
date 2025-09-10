import React from '@teact';
import { memo } from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import type { TabState } from '../../../global/types';

import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';

import Button from '../../ui/Button';
import Modal from '../../ui/Modal';

import styles from './CreditsModal.module.scss';

export type OwnProps = {
  modal: TabState['creditsModal'];
};

const CreditsModal = ({ modal }: OwnProps) => {
  const { closeCreditsModal } = getActions();
  const lang = useOldLang();

  const handleClose = useLastCallback(() => {
    closeCreditsModal();
  });

  return (
    <Modal
      isOpen={Boolean(modal?.isOpen)}
      contentClassName={styles.content}
      isSlim
      onClose={handleClose}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{lang('Credits')}</h2>
      </div>

      <div className={styles.body}>
        <div className={styles.balanceSection}>
          <div className={styles.balanceIcon}>⭐</div>
          <div className={styles.balanceInfo}>
            <div className={styles.balanceAmount}>1,250</div>
            <div className={styles.balanceLabel}>{lang('Available Credits')}</div>
          </div>
        </div>

        <div className={styles.historySection}>
          <h3 className={styles.sectionTitle}>{lang('Recent Transactions')}</h3>
          <div className={styles.transactionList}>
            <div className={styles.transaction}>
              <div className={styles.transactionIcon}>+</div>
              <div className={styles.transactionInfo}>
                <div className={styles.transactionTitle}>{lang('Daily Bonus')}</div>
                <div className={styles.transactionDate}>Today</div>
              </div>
              <div className={styles.transactionAmount}>+50</div>
            </div>
            <div className={styles.transaction}>
              <div className={styles.transactionIcon}>-</div>
              <div className={styles.transactionInfo}>
                <div className={styles.transactionTitle}>{lang('Premium Feature')}</div>
                <div className={styles.transactionDate}>Yesterday</div>
              </div>
              <div className={styles.transactionAmount}>-100</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          className={styles.closeButton}
          onClick={handleClose}
        >
          {lang('Close')}
        </Button>
      </div>
    </Modal>
  );
};

export default memo(CreditsModal);
